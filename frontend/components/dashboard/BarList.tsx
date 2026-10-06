export interface BarListItem {
  label: string;
  value: number;
  hint?: string;
}

// Accessible horizontal bar list. The numeric values are part of the list
// text (not colour-dependent), and the visual bars are decorative.
export default function BarList({
  title,
  items,
  valueSuffix = "",
  emptyMessage = "No data recorded yet.",
}: {
  title: string;
  items: BarListItem[];
  valueSuffix?: string;
  emptyMessage?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const hasData = items.some((item) => item.value > 0);

  return (
    <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {!hasData ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                <span className="font-medium">{item.label}</span>
                <span>
                  {item.value}
                  {valueSuffix}
                  {item.hint ? (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{item.hint}</span>
                  ) : null}
                </span>
              </div>
              <div
                className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                  style={{ width: `${Math.round((item.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
