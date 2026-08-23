const CATEGORY_TONES = [
  {
    keys: ["food", "makan", "occ order makan", "hungerstation", "naim", "restaurant", "brosted", "natah"],
    name: "Food",
    rowBg: "bg-orange-50/70 dark:bg-orange-950/70",
    iconBg: "bg-orange-100 dark:bg-orange-900",
    chipBg: "bg-orange-100 dark:bg-orange-900",
    border: "border-orange-100 dark:border-orange-900",
    ring: "ring-orange-100 dark:ring-orange-900",
    text: "text-orange-600 dark:text-orange-400",
    chipText: "text-orange-700 dark:text-orange-300",
    hex: "#f97316",
  },
  {
    keys: ["groceries", "grocery", "barang dapur", "dapur", "market"],
    name: "Groceries",
    rowBg: "bg-emerald-50/70 dark:bg-emerald-950/70",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    chipBg: "bg-emerald-100 dark:bg-emerald-900",
    border: "border-emerald-100 dark:border-emerald-900",
    ring: "ring-emerald-100 dark:ring-emerald-900",
    text: "text-emerald-600 dark:text-emerald-400",
    chipText: "text-emerald-700 dark:text-emerald-300",
    hex: "#10b981",
  },
  {
    keys: ["transport", "fuel", "petrol", "grab", "car", "parking", "toll"],
    name: "Transport",
    rowBg: "bg-sky-50/70 dark:bg-sky-950/70",
    iconBg: "bg-sky-100 dark:bg-sky-900",
    chipBg: "bg-sky-100 dark:bg-sky-900",
    border: "border-sky-100 dark:border-sky-900",
    ring: "ring-sky-100 dark:ring-sky-900",
    text: "text-sky-600 dark:text-sky-400",
    chipText: "text-sky-700 dark:text-sky-300",
    hex: "#0284c7",
  },
  {
    keys: ["kids", "anak", "school", "wifereqbrganak", "wife req. brg anak", "brg anak"],
    name: "Kids",
    rowBg: "bg-violet-50/70 dark:bg-violet-950/70",
    iconBg: "bg-violet-100 dark:bg-violet-900",
    chipBg: "bg-violet-100 dark:bg-violet-900",
    border: "border-violet-100 dark:border-violet-900",
    ring: "ring-violet-100 dark:ring-violet-900",
    text: "text-violet-600 dark:text-violet-400",
    chipText: "text-violet-700 dark:text-violet-300",
    hex: "#7c3aed",
  },
  {
    keys: ["bills", "bill", "utility", "electric", "water", "internet", "phone", "rent"],
    name: "Bills",
    rowBg: "bg-indigo-50/70 dark:bg-indigo-950/70",
    iconBg: "bg-indigo-100 dark:bg-indigo-900",
    chipBg: "bg-indigo-100 dark:bg-indigo-900",
    border: "border-indigo-100 dark:border-indigo-900",
    ring: "ring-indigo-100 dark:ring-indigo-900",
    text: "text-indigo-600 dark:text-indigo-400",
    chipText: "text-indigo-700 dark:text-indigo-300",
    hex: "#4f46e5",
  },
  {
    keys: ["shopping", "wife req", "wife req.", "wife", "shopee", "lazada"],
    name: "Shopping",
    rowBg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/70",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    chipBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    border: "border-fuchsia-100 dark:border-fuchsia-900",
    ring: "ring-fuchsia-100 dark:ring-fuchsia-900",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    chipText: "text-fuchsia-700 dark:text-fuchsia-300",
    hex: "#c026d3",
  },
  {
    keys: ["emergency", "urgent"],
    name: "Emergency",
    rowBg: "bg-red-50/70 dark:bg-red-950/70",
    iconBg: "bg-red-100 dark:bg-red-900",
    chipBg: "bg-red-100 dark:bg-red-900",
    border: "border-red-100 dark:border-red-900",
    ring: "ring-red-100 dark:ring-red-900",
    text: "text-red-600 dark:text-red-400",
    chipText: "text-red-700 dark:text-red-300",
    hex: "#dc2626",
  },
  {
    keys: ["healthcare", "health", "clinic", "doctor", "ubat", "pharmacy"],
    name: "Healthcare",
    rowBg: "bg-teal-50/70 dark:bg-teal-950/70",
    iconBg: "bg-teal-100 dark:bg-teal-900",
    chipBg: "bg-teal-100 dark:bg-teal-900",
    border: "border-teal-100 dark:border-teal-900",
    ring: "ring-teal-100 dark:ring-teal-900",
    text: "text-teal-600 dark:text-teal-400",
    chipText: "text-teal-700 dark:text-teal-300",
    hex: "#0d9488",
  },
  {
    keys: ["entertainment", "game", "movie", "netflix", "playstation"],
    name: "Entertainment",
    rowBg: "bg-pink-50/70 dark:bg-pink-950/70",
    iconBg: "bg-pink-100 dark:bg-pink-900",
    chipBg: "bg-pink-100 dark:bg-pink-900",
    border: "border-pink-100 dark:border-pink-900",
    ring: "ring-pink-100 dark:ring-pink-900",
    text: "text-pink-600 dark:text-pink-400",
    chipText: "text-pink-700 dark:text-pink-300",
    hex: "#db2777",
  },
];


const DISTINCT_CATEGORY_TONES = [
  {
    name: "Distinct Emerald",
    rowBg: "bg-emerald-50/70 dark:bg-emerald-950/70",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    chipBg: "bg-emerald-100 dark:bg-emerald-900",
    border: "border-emerald-100 dark:border-emerald-900",
    ring: "ring-emerald-100 dark:ring-emerald-900",
    text: "text-emerald-600 dark:text-emerald-400",
    chipText: "text-emerald-700 dark:text-emerald-300",
    hex: "#10b981",
  },
  {
    name: "Distinct Blue",
    rowBg: "bg-sky-50/70 dark:bg-sky-950/70",
    iconBg: "bg-sky-100 dark:bg-sky-900",
    chipBg: "bg-sky-100 dark:bg-sky-900",
    border: "border-sky-100 dark:border-sky-900",
    ring: "ring-sky-100 dark:ring-sky-900",
    text: "text-sky-600 dark:text-sky-400",
    chipText: "text-sky-700 dark:text-sky-300",
    hex: "#0284c7",
  },
  {
    name: "Distinct Indigo",
    rowBg: "bg-indigo-50/70 dark:bg-indigo-950/70",
    iconBg: "bg-indigo-100 dark:bg-indigo-900",
    chipBg: "bg-indigo-100 dark:bg-indigo-900",
    border: "border-indigo-100 dark:border-indigo-900",
    ring: "ring-indigo-100 dark:ring-indigo-900",
    text: "text-indigo-600 dark:text-indigo-400",
    chipText: "text-indigo-700 dark:text-indigo-300",
    hex: "#4f46e5",
  },
  {
    name: "Distinct Violet",
    rowBg: "bg-violet-50/70 dark:bg-violet-950/70",
    iconBg: "bg-violet-100 dark:bg-violet-900",
    chipBg: "bg-violet-100 dark:bg-violet-900",
    border: "border-violet-100 dark:border-violet-900",
    ring: "ring-violet-100 dark:ring-violet-900",
    text: "text-violet-600 dark:text-violet-400",
    chipText: "text-violet-700 dark:text-violet-300",
    hex: "#7c3aed",
  },
  {
    name: "Distinct Fuchsia",
    rowBg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/70",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    chipBg: "bg-fuchsia-100 dark:bg-fuchsia-900",
    border: "border-fuchsia-100 dark:border-fuchsia-900",
    ring: "ring-fuchsia-100 dark:ring-fuchsia-900",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    chipText: "text-fuchsia-700 dark:text-fuchsia-300",
    hex: "#c026d3",
  },
  {
    name: "Distinct Pink",
    rowBg: "bg-pink-50/70 dark:bg-pink-950/70",
    iconBg: "bg-pink-100 dark:bg-pink-900",
    chipBg: "bg-pink-100 dark:bg-pink-900",
    border: "border-pink-100 dark:border-pink-900",
    ring: "ring-pink-100 dark:ring-pink-900",
    text: "text-pink-600 dark:text-pink-400",
    chipText: "text-pink-700 dark:text-pink-300",
    hex: "#db2777",
  },
  {
    name: "Distinct Rose",
    rowBg: "bg-rose-50/70 dark:bg-rose-950/70",
    iconBg: "bg-rose-100 dark:bg-rose-900",
    chipBg: "bg-rose-100 dark:bg-rose-900",
    border: "border-rose-100 dark:border-rose-900",
    ring: "ring-rose-100 dark:ring-rose-900",
    text: "text-rose-600 dark:text-rose-400",
    chipText: "text-rose-700 dark:text-rose-300",
    hex: "#e11d48",
  },
  {
    name: "Distinct Orange",
    rowBg: "bg-orange-50/70 dark:bg-orange-950/70",
    iconBg: "bg-orange-100 dark:bg-orange-900",
    chipBg: "bg-orange-100 dark:bg-orange-900",
    border: "border-orange-100 dark:border-orange-900",
    ring: "ring-orange-100 dark:ring-orange-900",
    text: "text-orange-600 dark:text-orange-400",
    chipText: "text-orange-700 dark:text-orange-300",
    hex: "#f97316",
  },
  {
    name: "Distinct Amber",
    rowBg: "bg-amber-50/70 dark:bg-amber-950/70",
    iconBg: "bg-amber-100 dark:bg-amber-900",
    chipBg: "bg-amber-100 dark:bg-amber-900",
    border: "border-amber-100 dark:border-amber-900",
    ring: "ring-amber-100 dark:ring-amber-900",
    text: "text-amber-600 dark:text-amber-400",
    chipText: "text-amber-700 dark:text-amber-300",
    hex: "#d97706",
  },
  {
    name: "Distinct Teal",
    rowBg: "bg-teal-50/70 dark:bg-teal-950/70",
    iconBg: "bg-teal-100 dark:bg-teal-900",
    chipBg: "bg-teal-100 dark:bg-teal-900",
    border: "border-teal-100 dark:border-teal-900",
    ring: "ring-teal-100 dark:ring-teal-900",
    text: "text-teal-600 dark:text-teal-400",
    chipText: "text-teal-700 dark:text-teal-300",
    hex: "#0d9488",
  },
  {
    name: "Distinct Cyan",
    rowBg: "bg-cyan-50/70 dark:bg-cyan-950/70",
    iconBg: "bg-cyan-100 dark:bg-cyan-900",
    chipBg: "bg-cyan-100 dark:bg-cyan-900",
    border: "border-cyan-100 dark:border-cyan-900",
    ring: "ring-cyan-100 dark:ring-cyan-900",
    text: "text-cyan-600 dark:text-cyan-400",
    chipText: "text-cyan-700 dark:text-cyan-300",
    hex: "#0891b2",
  },
  {
    name: "Distinct Lime",
    rowBg: "bg-lime-50/70 dark:bg-lime-950/70",
    iconBg: "bg-lime-100 dark:bg-lime-900",
    chipBg: "bg-lime-100 dark:bg-lime-900",
    border: "border-lime-100 dark:border-lime-900",
    ring: "ring-lime-100 dark:ring-lime-900",
    text: "text-lime-600 dark:text-lime-400",
    chipText: "text-lime-700 dark:text-lime-300",
    hex: "#65a30d",
  },
];

const OTHER_TONE = {
  name: "Other",
  rowBg: "bg-slate-50/80 dark:bg-[#090d12]/80",
  iconBg: "bg-slate-100 dark:bg-slate-800",
  chipBg: "bg-slate-100 dark:bg-slate-800",
  border: "border-slate-200 dark:border-[#202733]",
  ring: "ring-slate-200 dark:ring-[#202733]",
  text: "text-slate-600 dark:text-slate-300",
  chipText: "text-slate-700 dark:text-slate-200",
  hex: "#64748b",
};

const HASH_TONES = CATEGORY_TONES.slice(0, 8);

function normalizeCategory(category = "") {
  return String(category || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hashCategory(category = "") {
  return normalizeCategory(category)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getExpenseCategoryTone(category = "") {
  const normalized = normalizeCategory(category);
  if (!normalized || normalized === "other" || normalized === "uncategorized") return OTHER_TONE;

  const matchedTone = CATEGORY_TONES.find((tone) => tone.keys.some((key) => normalized.includes(key)));
  if (matchedTone) return matchedTone;

  return HASH_TONES[hashCategory(normalized) % HASH_TONES.length] || OTHER_TONE;
}

export function getExpenseCategoryHex(category = "") {
  return getExpenseCategoryTone(category).hex;
}


export function getDistinctExpenseCategoryTone(category = "") {
  const normalized = normalizeCategory(category);
  if (!normalized || normalized === "other" || normalized === "uncategorized") return OTHER_TONE;

  return DISTINCT_CATEGORY_TONES[hashCategory(normalized) % DISTINCT_CATEGORY_TONES.length] || OTHER_TONE;
}

export function getDistinctExpenseCategoryHex(category = "") {
  return getDistinctExpenseCategoryTone(category).hex;
}


const CATEGORY_DISPLAY_PALETTE = [
  DISTINCT_CATEGORY_TONES[6],  // rose
  DISTINCT_CATEGORY_TONES[1],  // blue
  DISTINCT_CATEGORY_TONES[7],  // orange
  DISTINCT_CATEGORY_TONES[0],  // emerald
  DISTINCT_CATEGORY_TONES[3],  // violet
  DISTINCT_CATEGORY_TONES[8],  // amber
  DISTINCT_CATEGORY_TONES[9],  // teal
  DISTINCT_CATEGORY_TONES[4],  // fuchsia
  DISTINCT_CATEGORY_TONES[10], // cyan
  DISTINCT_CATEGORY_TONES[11], // lime
  DISTINCT_CATEGORY_TONES[2],  // indigo
  DISTINCT_CATEGORY_TONES[5],  // pink
];

export function getExpenseCategoryPaletteTone(index = 0) {
  const safeIndex = Number.isFinite(Number(index)) ? Math.abs(Number(index)) : 0;
  return CATEGORY_DISPLAY_PALETTE[safeIndex % CATEGORY_DISPLAY_PALETTE.length] || OTHER_TONE;
}

export function getExpenseCategoryPaletteHex(index = 0) {
  return getExpenseCategoryPaletteTone(index).hex;
}
