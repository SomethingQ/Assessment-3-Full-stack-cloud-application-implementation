// Typed client for the Phoneme Activity Builder backend API.
//
// NEXT_PUBLIC_API_URL must be reachable from the browser (these calls run
// in client components), so in Docker Compose it should point at the
// published host port for the backend service, not the internal service
// hostname.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const API_BASE_URL = API_URL;

export type ActivityType = "WORDLE" | "WORD_SEARCH";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface ApiWord {
  id: string;
  activityId: string;
  phonemes: string[];
  english: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivity {
  id: string;
  name: string;
  type: ActivityType;
  difficulty: Difficulty;
  showHints: boolean;
  numGuesses: number | null;
  rows: number | null;
  cols: number | null;
  words: ApiWord[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  database: "connected" | "unreachable";
  uptimeSeconds: number;
  timestamp: string;
  version: string;
}

export type AlertLevel = "error" | "warning" | "info";
export type GenerationStatus = "SUCCESS" | "FAILURE";
export type GenerationSource = "BUILDER" | "SAVED";

export interface DashboardAlert {
  level: AlertLevel;
  title: string;
  message: string;
}

export interface GenerationEventRecord {
  id: string;
  activityType: ActivityType;
  status: GenerationStatus;
  source: GenerationSource;
  wordCount: number;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
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
    mostUsedActivityType: ActivityType | "NONE";
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    successRate: number;
    averageGenerationMs: number;
    totalPageViews: number;
    averageTimeOnPageMs: number;
  };
  breakdown: {
    byActivityType: { type: ActivityType; count: number; words: number }[];
    byDifficulty: { difficulty: Difficulty; count: number }[];
    generationsByType: { type: ActivityType; success: number; failure: number; total: number }[];
    generationsBySource: { source: GenerationSource; count: number }[];
    pageViewsByPath: { path: string; views: number; averageMs: number }[];
  };
  recent: {
    generations: GenerationEventRecord[];
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
    type: ActivityType;
    difficulty: Difficulty;
    wordCount: number;
    generationCount: number;
    updatedAt: string;
  }[];
  generationLog: GenerationEventRecord[];
  slowestGenerations: { id: string; activityType: ActivityType; durationMs: number; createdAt: string }[];
  emptyActivities: { id: string; name: string; type: ActivityType; createdAt: string }[];
}

export interface GenerationEventInput {
  activityType: ActivityType;
  status: GenerationStatus;
  source?: GenerationSource;
  activityId?: string;
  wordCount?: number;
  durationMs?: number;
  errorMessage?: string;
}

export interface PageViewInput {
  path: string;
  sessionId?: string;
  durationMs?: number;
}

export interface SimulateInput {
  activities?: number;
  generations?: number;
  pageViews?: number;
}

export interface SimulateResult {
  activitiesCreated: number;
  generationsCreated: number;
  pageViewsCreated: number;
}

export interface WordInput {
  phonemes: string[];
  english?: string;
  position?: number;
}

export interface ActivityInput {
  name: string;
  type: ActivityType;
  difficulty?: Difficulty;
  showHints?: boolean;
  numGuesses?: number;
  rows?: number;
  cols?: number;
  words?: WordInput[];
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError(0, "Could not reach the API server. Is the backend running?");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && String(body.error)) ||
      res.statusText ||
      "Request failed";
    throw new ApiRequestError(res.status, message, body?.details);
  }

  return body as T;
}

export function fetchActivities(type?: ActivityType): Promise<ApiActivity[]> {
  const query = type ? `?type=${type}` : "";
  return request<ApiActivity[]>(`/api/activities${query}`);
}

export function fetchActivity(id: string): Promise<ApiActivity> {
  return request<ApiActivity>(`/api/activities/${id}`);
}

export function createActivity(input: ActivityInput): Promise<ApiActivity> {
  return request<ApiActivity>(`/api/activities`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateActivity(
  id: string,
  input: Partial<ActivityInput>,
): Promise<ApiActivity> {
  return request<ApiActivity>(`/api/activities/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteActivity(id: string): Promise<void> {
  return request<void>(`/api/activities/${id}`, { method: "DELETE" });
}

export function createWord(activityId: string, input: WordInput): Promise<ApiWord> {
  return request<ApiWord>(`/api/activities/${activityId}/words`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWord(wordId: string, input: Partial<WordInput>): Promise<ApiWord> {
  return request<ApiWord>(`/api/words/${wordId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteWord(wordId: string): Promise<void> {
  return request<void>(`/api/words/${wordId}`, { method: "DELETE" });
}

export function checkHealth(): Promise<HealthStatus> {
  return request<HealthStatus>(`/health`);
}

export function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return request<DashboardMetrics>(`/api/metrics/dashboard`);
}

export function fetchTimeseries(days = 14): Promise<TimeseriesPoint[]> {
  return request<TimeseriesPoint[]>(`/api/metrics/timeseries?days=${days}`);
}

export function fetchReportMetrics(): Promise<ReportMetrics> {
  return request<ReportMetrics>(`/api/metrics/report`);
}

// Fire-and-forget instrumentation call recorded after each generation attempt.
export function reportGeneration(input: GenerationEventInput): Promise<unknown> {
  return request<unknown>(`/api/events/generation`, {
    method: "POST",
    body: JSON.stringify(input),
    keepalive: true,
  });
}

// Fire-and-forget time-on-page beacon. Errors are swallowed by the caller so
// leaving a page never surfaces a console error to the user.
export function reportPageView(input: PageViewInput): Promise<unknown> {
  return request<unknown>(`/api/events/pageview`, {
    method: "POST",
    body: JSON.stringify(input),
    keepalive: true,
  });
}

export function simulateData(input: SimulateInput): Promise<SimulateResult> {
  return request<SimulateResult>(`/api/simulate`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
