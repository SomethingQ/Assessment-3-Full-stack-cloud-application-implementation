import type { DashboardAlert } from "@/lib/api";

const levelStyles: Record<DashboardAlert["level"], string> = {
  error: "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200",
  warning:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  info: "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
};

const levelLabels: Record<DashboardAlert["level"], string> = {
  error: "Error",
  warning: "Warning",
  info: "Info",
};

// Surfaces error/warning indicators for unusual states such as failed
// generations, empty word lists or a lack of recorded data.
export default function AlertList({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
        No alerts. All monitored signals are within normal ranges.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="System alerts">
      {alerts.map((alert, index) => (
        <li key={`${alert.title}-${index}`}>
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${levelStyles[alert.level]}`}
            role={alert.level === "error" ? "alert" : "status"}
          >
            <p className="font-semibold">
              <span className="mr-2 rounded bg-black/10 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide dark:bg-white/10">
                {levelLabels[alert.level]}
              </span>
              {alert.title}
            </p>
            <p className="mt-1">{alert.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
