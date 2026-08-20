export const EXPENSE_DATE_TONES = [
  {
    rowBg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/70",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    chipBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    border: "border-fuchsia-100 dark:border-fuchsia-900",
    ring: "ring-fuchsia-100 dark:ring-fuchsia-900",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    chipText: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    rowBg: "bg-indigo-50/70 dark:bg-indigo-950/70",
    iconBg: "bg-indigo-100 dark:bg-indigo-900",
    chipBg: "bg-indigo-100 dark:bg-indigo-900",
    border: "border-indigo-100 dark:border-indigo-900",
    ring: "ring-indigo-100 dark:ring-indigo-900",
    text: "text-indigo-600 dark:text-indigo-400",
    chipText: "text-indigo-700 dark:text-indigo-300",
  },
  {
    rowBg: "bg-orange-50/70 dark:bg-orange-950/70",
    iconBg: "bg-orange-100 dark:bg-orange-900",
    chipBg: "bg-orange-100 dark:bg-orange-900",
    border: "border-orange-100 dark:border-orange-900",
    ring: "ring-orange-100 dark:ring-orange-900",
    text: "text-orange-600 dark:text-orange-400",
    chipText: "text-orange-700 dark:text-orange-300",
  },
  {
    rowBg: "bg-emerald-50/70 dark:bg-emerald-950/70",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    chipBg: "bg-emerald-100 dark:bg-emerald-900",
    border: "border-emerald-100 dark:border-emerald-900",
    ring: "ring-emerald-100 dark:ring-emerald-900",
    text: "text-emerald-600 dark:text-emerald-400",
    chipText: "text-emerald-700 dark:text-emerald-300",
  },
  {
    rowBg: "bg-sky-50/70 dark:bg-sky-950/70",
    iconBg: "bg-sky-100 dark:bg-sky-900",
    chipBg: "bg-sky-100 dark:bg-sky-900",
    border: "border-sky-100 dark:border-sky-900",
    ring: "ring-sky-100 dark:ring-sky-900",
    text: "text-sky-600 dark:text-sky-400",
    chipText: "text-sky-700 dark:text-sky-300",
  },
  {
    rowBg: "bg-rose-50/70 dark:bg-rose-950/70",
    iconBg: "bg-rose-100 dark:bg-rose-900",
    chipBg: "bg-rose-100 dark:bg-rose-900",
    border: "border-rose-100 dark:border-rose-900",
    ring: "ring-rose-100 dark:ring-rose-900",
    text: "text-rose-600 dark:text-rose-400",
    chipText: "text-rose-700 dark:text-rose-300",
  },
];

export function getExpenseDateTone(date) {
  const dateKey = String(date || "unknown").slice(0, 10);
  const hash = dateKey.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return EXPENSE_DATE_TONES[hash % EXPENSE_DATE_TONES.length];
}
