export const EXPENSE_DATE_TONES = [
  {
    rowBg: "bg-fuchsia-50/70",
    iconBg: "bg-fuchsia-100",
    chipBg: "bg-fuchsia-100",
    border: "border-fuchsia-100",
    ring: "ring-fuchsia-100",
    text: "text-fuchsia-600",
    chipText: "text-fuchsia-700",
  },
  {
    rowBg: "bg-indigo-50/70",
    iconBg: "bg-indigo-100",
    chipBg: "bg-indigo-100",
    border: "border-indigo-100",
    ring: "ring-indigo-100",
    text: "text-indigo-600",
    chipText: "text-indigo-700",
  },
  {
    rowBg: "bg-orange-50/70",
    iconBg: "bg-orange-100",
    chipBg: "bg-orange-100",
    border: "border-orange-100",
    ring: "ring-orange-100",
    text: "text-orange-600",
    chipText: "text-orange-700",
  },
  {
    rowBg: "bg-emerald-50/70",
    iconBg: "bg-emerald-100",
    chipBg: "bg-emerald-100",
    border: "border-emerald-100",
    ring: "ring-emerald-100",
    text: "text-emerald-600",
    chipText: "text-emerald-700",
  },
  {
    rowBg: "bg-sky-50/70",
    iconBg: "bg-sky-100",
    chipBg: "bg-sky-100",
    border: "border-sky-100",
    ring: "ring-sky-100",
    text: "text-sky-600",
    chipText: "text-sky-700",
  },
  {
    rowBg: "bg-rose-50/70",
    iconBg: "bg-rose-100",
    chipBg: "bg-rose-100",
    border: "border-rose-100",
    ring: "ring-rose-100",
    text: "text-rose-600",
    chipText: "text-rose-700",
  },
];

export function getExpenseDateTone(date) {
  const dateKey = String(date || "unknown").slice(0, 10);
  const hash = dateKey.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return EXPENSE_DATE_TONES[hash % EXPENSE_DATE_TONES.length];
}
