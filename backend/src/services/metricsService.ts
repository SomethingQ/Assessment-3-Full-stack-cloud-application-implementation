import { prisma } from "../db";

export type AlertLevel = "error" | "warning" | "info";

export interface DashboardAlert {
  level: AlertLevel;
  title: string;
  message: string;
}

export interface DashboardMetrics {
  generatedAt: string;
  health: {
    status: "ok" | "degraded";
    database: "connected" | "unreachable";
    uptimeSeconds: number;
  };
  summary: {
    totalActivities: number;
    wordleActivities: number;
    wordSearchActivities: number;
    totalWords: number;
    averageWordsPerActivity: number;
    emptyWordListActivities: number;
    mostUsedActivityType: "WORDLE" | "WORD_SEARCH" | "NONE";
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    successRate: number;
    averageGenerationMs: number;
    totalPageViews: number;
    averageTimeOnPageMs: number;
  };
  breakdown: {
    byActivityType: { type: string; count: number; words: number }[];
    byDifficulty: { difficulty: string; count: number }[];
    generationsByType: { type: string; success: number; failure: number; total: number }[];
    generationsBySource: { source: string; count: number }[];
    pageViewsByPath: { path: string; views: number; averageMs: number }[];
  };
  recent: {
    generations: {
      id: string;
      activityType: string;
      status: string;
      source: string;
      wordCount: number;
      durationMs: number;
      errorMessage: string | null;
      createdAt: string;
    }[];
  };
  alerts: DashboardAlert[];
}

export interface TimeseriesPoint {
  date: string;
  activities: number;
  generationsSuccess: number;
  generationsFailure: number;
  pageViews: number;
}

export interface ReportMetrics {
  generatedAt: string;
  topActivities: {
    id: string;
    name: string;
    type: string;
    difficulty: string;
    wordCount: number;
    generationCount: number;
    updatedAt: string;
  }[];
  generationLog: {
    id: string;
    activityType: string;
    status: string;
    source: string;
    wordCount: number;
    durationMs: number;
    errorMessage: string | null;
    createdAt: string;
  }[];
  slowestGenerations: { id: string; activityType: string; durationMs: number; createdAt: string }[];
  emptyActivities: { id: string; name: string; type: string; createdAt: string }[];
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toIso(date: Date): string {
  return date.toISOString();
}

// Aggregates every database-backed statistic used by the dashboard in a
// single pass so the client only needs one request to render the whole view.
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    activities,
    generationGroups,
    generationSourceGroups,
    generationAggregate,
    recentGenerations,
    pageViewAggregate,
    pageViewPathGroups,
  ] = await Promise.all([
    prisma.activity.findMany({
      select: {
        id: true,
        type: true,
        difficulty: true,
        numGuesses: true,
        rows: true,
        cols: true,
        _count: { select: { words: true, generations: true } },
      },
    }),
    prisma.generationEvent.groupBy({
      by: ["activityType", "status"],
      _count: { _all: true },
    }),
    prisma.generationEvent.groupBy({
      by: ["source"],
      _count: { _all: true },
    }),
    prisma.generationEvent.aggregate({
      _count: { _all: true },
      _avg: { durationMs: true },
    }),
    prisma.generationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.pageView.aggregate({
      _count: { _all: true },
      _avg: { durationMs: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { _all: true },
      _avg: { durationMs: true },
    }),
  ]);

  const wordleActivities = activities.filter((a) => a.type === "WORDLE").length;
  const wordSearchActivities = activities.filter((a) => a.type === "WORD_SEARCH").length;
  const totalWords = activities.reduce((sum, a) => sum + a._count.words, 0);
  const emptyWordListActivities = activities.filter((a) => a._count.words === 0);

  const byActivityType = (["WORDLE", "WORD_SEARCH"] as const).map((type) => {
    const matching = activities.filter((a) => a.type === type);
    return {
      type,
      count: matching.length,
      words: matching.reduce((sum, a) => sum + a._count.words, 0),
    };
  });

  const byDifficulty = (["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => ({
    difficulty,
    count: activities.filter((a) => a.difficulty === difficulty).length,
  }));

  const generationsByType = (["WORDLE", "WORD_SEARCH"] as const).map((type) => {
    const success =
      generationGroups.find((g) => g.activityType === type && g.status === "SUCCESS")?._count._all ?? 0;
    const failure =
      generationGroups.find((g) => g.activityType === type && g.status === "FAILURE")?._count._all ?? 0;
    return { type, success, failure, total: success + failure };
  });

  const successfulGenerations = generationGroups
    .filter((g) => g.status === "SUCCESS")
    .reduce((sum, g) => sum + g._count._all, 0);
  const failedGenerations = generationGroups
    .filter((g) => g.status === "FAILURE")
    .reduce((sum, g) => sum + g._count._all, 0);
  const totalGenerations = generationAggregate._count._all;
  const successRate =
    totalGenerations === 0 ? 100 : round((successfulGenerations / totalGenerations) * 100, 1);

  // "Most-used activity type" is derived from generation attempts, falling
  // back to stored activity counts when nothing has been generated yet.
  const mostUsedFromGenerations =
    successfulGenerations + failedGenerations > 0
      ? [...generationsByType].sort((a, b) => b.total - a.total)[0]
      : undefined;
  let mostUsedActivityType: "WORDLE" | "WORD_SEARCH" | "NONE" = "NONE";
  if (mostUsedFromGenerations && mostUsedFromGenerations.total > 0) {
    mostUsedActivityType = mostUsedFromGenerations.type;
  } else if (wordleActivities > 0 || wordSearchActivities > 0) {
    mostUsedActivityType = wordleActivities >= wordSearchActivities ? "WORDLE" : "WORD_SEARCH";
  }

  const totalPageViews = pageViewAggregate._count._all;
  const averageTimeOnPageMs = round(pageViewAggregate._avg.durationMs ?? 0);

  const alerts = buildAlerts({
    totalActivities: activities.length,
    emptyWordListActivities,
    failedGenerations,
    totalGenerations,
    successRate,
    byActivityType,
  });

  return {
    generatedAt: new Date().toISOString(),
    health: {
      status: "ok",
      database: "connected",
      uptimeSeconds: round(process.uptime()),
    },
    summary: {
      totalActivities: activities.length,
      wordleActivities,
      wordSearchActivities,
      totalWords,
      averageWordsPerActivity:
        activities.length === 0 ? 0 : round(totalWords / activities.length, 1),
      emptyWordListActivities: emptyWordListActivities.length,
      mostUsedActivityType,
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      successRate,
      averageGenerationMs: round(generationAggregate._avg.durationMs ?? 0),
      totalPageViews,
      averageTimeOnPageMs,
    },
    breakdown: {
      byActivityType,
      byDifficulty,
      generationsByType,
      generationsBySource: generationSourceGroups.map((g) => ({
        source: g.source,
        count: g._count._all,
      })),
      pageViewsByPath: pageViewPathGroups
        .map((g) => ({
          path: g.path,
          views: g._count._all,
          averageMs: round(g._avg.durationMs ?? 0),
        }))
        .sort((a, b) => b.views - a.views),
    },
    recent: {
      generations: recentGenerations.map((g) => ({
        id: g.id,
        activityType: g.activityType,
        status: g.status,
        source: g.source,
        wordCount: g.wordCount,
        durationMs: g.durationMs,
        errorMessage: g.errorMessage,
        createdAt: toIso(g.createdAt),
      })),
    },
    alerts,
  };
}

function buildAlerts(input: {
  totalActivities: number;
  emptyWordListActivities: { id: string }[];
  failedGenerations: number;
  totalGenerations: number;
  successRate: number;
  byActivityType: { type: string; count: number; words: number }[];
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (input.totalActivities === 0 && input.totalGenerations === 0) {
    alerts.push({
      level: "info",
      title: "No data recorded yet",
      message:
        "Create an activity or run the data simulator to populate the dashboard with records.",
    });
  }

  if (input.emptyWordListActivities.length > 0) {
    alerts.push({
      level: "warning",
      title: "Empty word lists detected",
      message: `${input.emptyWordListActivities.length} saved activity(ies) have no words and cannot generate an activity.`,
    });
  }

  if (input.failedGenerations > 0) {
    const level = input.successRate < 80 ? "error" : "warning";
    alerts.push({
      level,
      title: "Failed generations",
      message: `${input.failedGenerations} generation attempt(s) failed. Current success rate is ${input.successRate}%.`,
    });
  }

  for (const type of input.byActivityType) {
    if (type.count === 0) {
      alerts.push({
        level: "info",
        title: `No ${type.type === "WORDLE" ? "Wordle" : "Word Search"} activities`,
        message: `No ${type.type === "WORDLE" ? "Wordle" : "Word Search"} activity configurations have been created yet.`,
      });
    }
  }

  return alerts;
}

// Daily buckets for the reporting charts. Days with no records are still
// returned with zero counts so the chart shows a continuous timeline.
export async function getTimeseries(days: number): Promise<TimeseriesPoint[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [activities, generations, pageViews] = await Promise.all([
    prisma.activity.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.generationEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    }),
    prisma.pageView.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  const points = new Map<string, TimeseriesPoint>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    points.set(key, {
      date: key,
      activities: 0,
      generationsSuccess: 0,
      generationsFailure: 0,
      pageViews: 0,
    });
  }

  const keyOf = (date: Date) => date.toISOString().slice(0, 10);

  for (const activity of activities) {
    const point = points.get(keyOf(activity.createdAt));
    if (point) point.activities += 1;
  }
  for (const generation of generations) {
    const point = points.get(keyOf(generation.createdAt));
    if (!point) continue;
    if (generation.status === "SUCCESS") point.generationsSuccess += 1;
    else point.generationsFailure += 1;
  }
  for (const view of pageViews) {
    const point = points.get(keyOf(view.createdAt));
    if (point) point.pageViews += 1;
  }

  return [...points.values()];
}

export async function getReportMetrics(): Promise<ReportMetrics> {
  const [topActivities, generationLog, slowestGenerations, emptyActivities] = await Promise.all([
    prisma.activity.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        difficulty: true,
        updatedAt: true,
        _count: { select: { words: true, generations: true } },
      },
      orderBy: { generations: { _count: "desc" } },
      take: 10,
    }),
    prisma.generationEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.generationEvent.findMany({
      where: { status: "SUCCESS" },
      orderBy: { durationMs: "desc" },
      take: 10,
    }),
    prisma.activity.findMany({
      where: { words: { none: {} } },
      select: { id: true, name: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    topActivities: topActivities.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      difficulty: a.difficulty,
      wordCount: a._count.words,
      generationCount: a._count.generations,
      updatedAt: toIso(a.updatedAt),
    })),
    generationLog: generationLog.map((g) => ({
      id: g.id,
      activityType: g.activityType,
      status: g.status,
      source: g.source,
      wordCount: g.wordCount,
      durationMs: g.durationMs,
      errorMessage: g.errorMessage,
      createdAt: toIso(g.createdAt),
    })),
    slowestGenerations: slowestGenerations.map((g) => ({
      id: g.id,
      activityType: g.activityType,
      durationMs: g.durationMs,
      createdAt: toIso(g.createdAt),
    })),
    emptyActivities: emptyActivities.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      createdAt: toIso(a.createdAt),
    })),
  };
}
