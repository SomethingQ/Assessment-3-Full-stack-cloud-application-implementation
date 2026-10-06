import type { TimeseriesPoint } from "@/lib/api";

function shortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Stacked daily bar chart for activities, generations and page views. The
// visual bars are decorative; the same data is exposed as a visually hidden
// table so screen readers get the full time series.
export default function TimeseriesChart({ points }: { points: TimeseriesPoint[] }) {
  const max = Math.max(
    1,
    ...points.map((p) => p.activities + p.generationsSuccess + p.generationsFailure + p.pageViews),
  );

  return (
    <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Last {points.length} days
        </h3>
        <ul className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
          <li className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-indigo-600 dark:bg-indigo-500" aria-hidden="true" />
            Activities
          </li>
          <li className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" aria-hidden="true" />
            Successful generations
          </li>
          <li className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-600 dark:bg-red-500" aria-hidden="true" />
            Failed generations
          </li>
          <li className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-slate-500" aria-hidden="true" />
            Page views
          </li>
        </ul>
      </div>

      <div className="mt-4 flex h-40 items-end gap-1" aria-hidden="true">
        {points.map((point) => {
          const total =
            point.activities + point.generationsSuccess + point.generationsFailure + point.pageViews;
          const height = total === 0 ? 2 : Math.max(4, Math.round((total / max) * 160));
          return (
            <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              <div className="flex w-full flex-col items-stretch justify-end" style={{ height: `${height}px` }}>
                <div
                  className="w-full bg-indigo-600 dark:bg-indigo-500"
                  style={{ flexGrow: point.activities || 0.0001 }}
                />
                <div
                  className="w-full bg-emerald-600 dark:bg-emerald-500"
                  style={{ flexGrow: point.generationsSuccess || 0.0001 }}
                />
                <div
                  className="w-full bg-red-600 dark:bg-red-500"
                  style={{ flexGrow: point.generationsFailure || 0.0001 }}
                />
                <div
                  className="w-full bg-slate-500"
                  style={{ flexGrow: point.pageViews || 0.0001 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1 text-[10px] text-slate-500 dark:text-slate-400">
        {points.map((point) => (
          <span key={point.date} className="min-w-0 flex-1 truncate text-center">
            {shortDate(point.date)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Daily activity, generation and page view counts</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Activities</th>
            <th scope="col">Successful generations</th>
            <th scope="col">Failed generations</th>
            <th scope="col">Page views</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{point.date}</th>
              <td>{point.activities}</td>
              <td>{point.generationsSuccess}</td>
              <td>{point.generationsFailure}</td>
              <td>{point.pageViews}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
