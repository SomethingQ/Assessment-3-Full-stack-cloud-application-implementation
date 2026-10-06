import type { ReactNode } from "react";

export type StatTone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatTone, string> = {
  default: "border-slate-300 dark:border-slate-700",
  success: "border-emerald-300 dark:border-emerald-700",
  warning: "border-amber-300 dark:border-amber-700",
  danger: "border-red-300 dark:border-red-700",
  info: "border-indigo-300 dark:border-indigo-700",
};

const valueToneClasses: Record<StatTone, string> = {
  default: "text-slate-900 dark:text-slate-100",
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-red-700 dark:text-red-400",
  info: "text-indigo-700 dark:text-indigo-400",
};

// A single KPI tile used across the dashboard summary grid.
export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: StatTone;
  icon?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-white/70 p-4 dark:bg-slate-900/40 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {icon ? <span aria-hidden="true">{icon}</span> : null}
      </div>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueToneClasses[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
