"use client";

import { useCallback, useEffect, useState } from "react";

import AlertList from "@/components/dashboard/AlertList";
import BarList from "@/components/dashboard/BarList";
import StatCard from "@/components/dashboard/StatCard";
import TimeseriesChart from "@/components/dashboard/TimeseriesChart";
import {
  ApiRequestError,
  checkHealth,
  fetchDashboardMetrics,
  fetchReportMetrics,
  fetchTimeseries,
  simulateData,
  type DashboardMetrics,
  type HealthStatus,
  type ReportMetrics,
  type TimeseriesPoint,
} from "@/lib/api";
import { formatDateTime, formatDuration, formatNumber, formatPercent } from "@/lib/format";

const DEFAULT_SIMULATION = { activities: 5, generations: 40, pageViews: 50 };

function errorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong while loading dashboard data";
}

function typeLabel(type: string): string {
  if (type === "WORDLE") return "Wordle";
  if (type === "WORD_SEARCH") return "Word Search";
  return type;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [report, setReport] = useState<ReportMetrics | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [dashboard, series, reportData, healthStatus] = await Promise.all([
        fetchDashboardMetrics(),
        fetchTimeseries(14),
        fetchReportMetrics(),
        checkHealth(),
      ]);
      setMetrics(dashboard);
      setTimeseries(series);
      setReport(reportData);
      setHealth(healthStatus);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await fetchAll();
    setIsLoading(false);
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await fetchAll();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  // Poll the health endpoint so the status indicator reflects live behaviour
  // while the dashboard is open.
  useEffect(() => {
    const id = window.setInterval(() => {
      checkHealth()
        .then(setHealth)
        .catch(() => setHealth(null));
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);

  async function handleSimulate() {
    setIsSimulating(true);
    setSimMessage("");
    try {
      const result = await simulateData(DEFAULT_SIMULATION);
      setSimMessage(
        `Simulated ${result.activitiesCreated} activities, ${result.generationsCreated} generation events and ${result.pageViewsCreated} page views.`,
      );
      await loadAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSimulating(false);
    }
  }

  const summary = metrics?.summary;
  const isHealthy = health?.status === "ok" && health?.database === "connected";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col space-y-6 px-6 py-20">
      <section className="w-full rounded-2xl backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Operational Dashboard
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Database-backed usage statistics, health monitoring, alerts and reporting for the
              Wordle and Word Search builder.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadAll}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              data-testid="simulate-button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {isSimulating ? "Simulating..." : "Simulate input records"}
            </button>
          </div>
        </div>
        <hr className="mt-6 w-full border-slate-600 dark:border-slate-300" />
      </section>

      {simMessage && (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
          {simMessage}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <section aria-labelledby="health-heading" className="w-full">
        <h2
          id="health-heading"
          className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
        >
          System health
        </h2>
        <div
          data-testid="dashboard-health"
          className={`flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border px-4 py-3 text-sm ${
            isHealthy
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
          }`}
        >
          <span className="flex items-center gap-2 font-semibold">
            <span aria-hidden="true">{isHealthy ? "●" : "▲"}</span>
            <span>Status: {health ? (isHealthy ? "OK" : "Degraded") : "Unknown"}</span>
          </span>
          <span>API /health returns 200 OK</span>
          <span>Database: {health?.database ?? "unknown"}</span>
          {health && <span>Uptime: {formatDuration(health.uptimeSeconds * 1000)}</span>}
          {health && <span>API version: {health.version}</span>}
        </div>
      </section>

      <section aria-labelledby="alerts-heading" className="w-full">
        <h2
          id="alerts-heading"
          className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
        >
          Alerts and warnings
        </h2>
        {metrics ? (
          <AlertList alerts={metrics.alerts} />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLoading ? "Loading alerts..." : "Alert data unavailable."}
          </p>
        )}
      </section>

      <section aria-labelledby="summary-heading" className="w-full">
        <h2
          id="summary-heading"
          className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
        >
          Usage summary
        </h2>
        {summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total activities"
              value={formatNumber(summary.totalActivities)}
              hint={`${formatNumber(summary.totalWords)} stored words`}
              tone="info"
            />
            <StatCard
              label="Wordle activities"
              value={formatNumber(summary.wordleActivities)}
              hint={`Avg ${summary.averageWordsPerActivity} words/activity`}
            />
            <StatCard
              label="Word Search activities"
              value={formatNumber(summary.wordSearchActivities)}
              hint={`${formatNumber(summary.emptyWordListActivities)} empty word lists`}
            />
            <StatCard
              label="Most-used activity type"
              value={summary.mostUsedActivityType === "NONE" ? "None" : typeLabel(summary.mostUsedActivityType)}
              hint="Based on generation activity"
            />
            <StatCard
              label="Successful generations"
              value={formatNumber(summary.successfulGenerations)}
              hint={`Success rate ${formatPercent(summary.successRate)}`}
              tone="success"
            />
            <StatCard
              label="Failed generations"
              value={formatNumber(summary.failedGenerations)}
              hint={`${formatNumber(summary.totalGenerations)} total attempts`}
              tone={summary.failedGenerations > 0 ? "danger" : "default"}
            />
            <StatCard
              label="Average time on page"
              value={formatDuration(summary.averageTimeOnPageMs)}
              hint={`${formatNumber(summary.totalPageViews)} page views tracked`}
            />
            <StatCard
              label="Average generation time"
              value={formatDuration(summary.averageGenerationMs)}
              hint="Server-reported build time"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLoading ? "Loading summary..." : "Summary unavailable."}
          </p>
        )}
      </section>

      {metrics && (
        <section aria-labelledby="breakdown-heading" className="w-full">
          <h2
            id="breakdown-heading"
            className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
          >
            Reporting views
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarList
              title="Activities by type"
              items={metrics.breakdown.byActivityType.map((item) => ({
                label: typeLabel(item.type),
                value: item.count,
                hint: `${item.words} words`,
              }))}
            />
            <BarList
              title="Activities by difficulty"
              items={metrics.breakdown.byDifficulty.map((item) => ({
                label: item.difficulty,
                value: item.count,
              }))}
            />
            <BarList
              title="Generation attempts by type"
              items={metrics.breakdown.generationsByType.map((item) => ({
                label: typeLabel(item.type),
                value: item.total,
                hint: `${item.success} ok / ${item.failure} failed`,
              }))}
            />
            <BarList
              title="Generation source"
              items={metrics.breakdown.generationsBySource.map((item) => ({
                label: item.source === "SAVED" ? "Saved word list" : "Builder form",
                value: item.count,
              }))}
            />
          </div>

          <div className="mt-4">
            <TimeseriesChart points={timeseries} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">Usage by reporting view</caption>
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">Page</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Views</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Average time on page</th>
                </tr>
              </thead>
              <tbody>
                {metrics.breakdown.pageViewsByPath.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      No page views recorded yet.
                    </td>
                  </tr>
                ) : (
                  metrics.breakdown.pageViewsByPath.map((item) => (
                    <tr key={item.path} className="border-t border-slate-200 dark:border-slate-700">
                      <th scope="row" className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                        {item.path}
                      </th>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.views}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {formatDuration(item.averageMs)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {metrics && (
        <section aria-labelledby="recent-heading" className="w-full">
          <h2
            id="recent-heading"
            className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
          >
            Recent generation events
          </h2>
          <div
            data-testid="generation-log"
            className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700"
          >
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">Most recent activity generation attempts</caption>
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">When</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Source</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Words</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent.generations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      No generation attempts recorded yet.
                    </td>
                  </tr>
                ) : (
                  metrics.recent.generations.map((event) => (
                    <tr key={event.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {formatDateTime(event.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {typeLabel(event.activityType)}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {event.source === "SAVED" ? "Saved" : "Builder"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            event.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {event.status}
                        </span>
                        {event.errorMessage ? (
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            {event.errorMessage}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{event.wordCount}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                        {formatDuration(event.durationMs)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report && (
        <section aria-labelledby="report-heading" className="w-full">
          <h2
            id="report-heading"
            className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
          >
            Activity report
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Most active activities
              </h3>
              {report.topActivities.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No activities saved yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {report.topActivities.slice(0, 5).map((activity) => (
                    <li key={activity.id} className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium" title={activity.name}>
                        {activity.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {activity.generationCount} runs · {activity.wordCount} words
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Empty word lists
              </h3>
              {report.emptyActivities.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                  Every saved activity has at least one word.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-amber-700 dark:text-amber-400">
                  {report.emptyActivities.map((activity) => (
                    <li key={activity.id} className="truncate" title={activity.name}>
                      {activity.name} ({typeLabel(activity.type)})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Slowest successful generations
              </h3>
              {report.slowestGenerations.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No successful generations recorded yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {report.slowestGenerations.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span>{typeLabel(item.activityType)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDuration(item.durationMs)} · {formatDateTime(item.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {metrics && (
        <p className="w-full text-sm text-slate-500 dark:text-slate-400">
          Metrics generated at {formatDateTime(metrics.generatedAt)}. API uptime{" "}
          {formatDuration(metrics.health.uptimeSeconds * 1000)}.
        </p>
      )}
    </main>
  );
}
