const CATEGORY_TONES = [
  {
    keys: ["food", "makan", "occ order makan", "hungerstation", "naim", "restaurant", "brosted", "natah"],
    name: "Food",
    rowBg: "bg-orange-50/70",
    iconBg: "bg-orange-100",
    chipBg: "bg-orange-100",
    border: "border-orange-100",
    ring: "ring-orange-100",
    text: "text-orange-600",
    chipText: "text-orange-700",
    hex: "#f97316",
  },
  {
    keys: ["groceries", "grocery", "barang dapur", "dapur", "market"],
    name: "Groceries",
    rowBg: "bg-emerald-50/70",
    iconBg: "bg-emerald-100",
    chipBg: "bg-emerald-100",
    border: "border-emerald-100",
    ring: "ring-emerald-100",
    text: "text-emerald-600",
    chipText: "text-emerald-700",
    hex: "#10b981",
  },
  {
    keys: ["transport", "fuel", "petrol", "grab", "car", "parking", "toll"],
    name: "Transport",
    rowBg: "bg-sky-50/70",
    iconBg: "bg-sky-100",
    chipBg: "bg-sky-100",
    border: "border-sky-100",
    ring: "ring-sky-100",
    text: "text-sky-600",
    chipText: "text-sky-700",
    hex: "#0284c7",
  },
  {
    keys: ["kids", "anak", "school", "wifereqbrganak", "wife req. brg anak", "brg anak"],
    name: "Kids",
    rowBg: "bg-violet-50/70",
    iconBg: "bg-violet-100",
    chipBg: "bg-violet-100",
    border: "border-violet-100",
    ring: "ring-violet-100",
    text: "text-violet-600",
    chipText: "text-violet-700",
    hex: "#7c3aed",
  },
  {
    keys: ["bills", "bill", "utility", "electric", "water", "internet", "phone", "rent"],
    name: "Bills",
    rowBg: "bg-indigo-50/70",
    iconBg: "bg-indigo-100",
    chipBg: "bg-indigo-100",
    border: "border-indigo-100",
    ring: "ring-indigo-100",
    text: "text-indigo-600",
    chipText: "text-indigo-700",
    hex: "#4f46e5",
  },
  {
    keys: ["shopping", "wife req", "wife req.", "wife", "shopee", "lazada"],
    name: "Shopping",
    rowBg: "bg-fuchsia-50/70",
    iconBg: "bg-fuchsia-100",
    chipBg: "bg-fuchsia-100",
    border: "border-fuchsia-100",
    ring: "ring-fuchsia-100",
    text: "text-fuchsia-600",
    chipText: "text-fuchsia-700",
    hex: "#c026d3",
  },
  {
    keys: ["emergency", "urgent"],
    name: "Emergency",
    rowBg: "bg-red-50/70",
    iconBg: "bg-red-100",
    chipBg: "bg-red-100",
    border: "border-red-100",
    ring: "ring-red-100",
    text: "text-red-600",
    chipText: "text-red-700",
    hex: "#dc2626",
  },
  {
    keys: ["healthcare", "health", "clinic", "doctor", "ubat", "pharmacy"],
    name: "Healthcare",
    rowBg: "bg-teal-50/70",
    iconBg: "bg-teal-100",
    chipBg: "bg-teal-100",
    border: "border-teal-100",
    ring: "ring-teal-100",
    text: "text-teal-600",
    chipText: "text-teal-700",
    hex: "#0d9488",
  },
  {
    keys: ["entertainment", "game", "movie", "netflix", "playstation"],
    name: "Entertainment",
    rowBg: "bg-pink-50/70",
    iconBg: "bg-pink-100",
    chipBg: "bg-pink-100",
    border: "border-pink-100",
    ring: "ring-pink-100",
    text: "text-pink-600",
    chipText: "text-pink-700",
    hex: "#db2777",
  },
];


const DISTINCT_CATEGORY_TONES = [
  {
    name: "Distinct Emerald",
    rowBg: "bg-emerald-50/70",
    iconBg: "bg-emerald-100",
    chipBg: "bg-emerald-100",
    border: "border-emerald-100",
    ring: "ring-emerald-100",
    text: "text-emerald-600",
    chipText: "text-emerald-700",
    hex: "#10b981",
  },
  {
    name: "Distinct Blue",
    rowBg: "bg-sky-50/70",
    iconBg: "bg-sky-100",
    chipBg: "bg-sky-100",
    border: "border-sky-100",
    ring: "ring-sky-100",
    text: "text-sky-600",
    chipText: "text-sky-700",
    hex: "#0284c7",
  },
  {
    name: "Distinct Indigo",
    rowBg: "bg-indigo-50/70",
    iconBg: "bg-indigo-100",
    chipBg: "bg-indigo-100",
    border: "border-indigo-100",
    ring: "ring-indigo-100",
    text: "text-indigo-600",
    chipText: "text-indigo-700",
    hex: "#4f46e5",
  },
  {
    name: "Distinct Violet",
    rowBg: "bg-violet-50/70",
    iconBg: "bg-violet-100",
    chipBg: "bg-violet-100",
    border: "border-violet-100",
    ring: "ring-violet-100",
    text: "text-violet-600",
    chipText: "text-violet-700",
    hex: "#7c3aed",
  },
  {
    name: "Distinct Fuchsia",
    rowBg: "bg-fuchsia-50/70",
    iconBg: "bg-fuchsia-100",
    chipBg: "bg-fuchsia-100",
    border: "border-fuchsia-100",
    ring: "ring-fuchsia-100",
    text: "text-fuchsia-600",
    chipText: "text-fuchsia-700",
    hex: "#c026d3",
  },
  {
    name: "Distinct Pink",
    rowBg: "bg-pink-50/70",
    iconBg: "bg-pink-100",
    chipBg: "bg-pink-100",
    border: "border-pink-100",
    ring: "ring-pink-100",
    text: "text-pink-600",
    chipText: "text-pink-700",
    hex: "#db2777",
  },
  {
    name: "Distinct Rose",
    rowBg: "bg-rose-50/70",
    iconBg: "bg-rose-100",
    chipBg: "bg-rose-100",
    border: "border-rose-100",
    ring: "ring-rose-100",
    text: "text-rose-600",
    chipText: "text-rose-700",
    hex: "#e11d48",
  },
  {
    name: "Distinct Orange",
    rowBg: "bg-orange-50/70",
    iconBg: "bg-orange-100",
    chipBg: "bg-orange-100",
    border: "border-orange-100",
    ring: "ring-orange-100",
    text: "text-orange-600",
    chipText: "text-orange-700",
    hex: "#f97316",
  },
  {
    name: "Distinct Amber",
    rowBg: "bg-amber-50/70",
    iconBg: "bg-amber-100",
    chipBg: "bg-amber-100",
    border: "border-amber-100",
    ring: "ring-amber-100",
    text: "text-amber-600",
    chipText: "text-amber-700",
    hex: "#d97706",
  },
  {
    name: "Distinct Teal",
    rowBg: "bg-teal-50/70",
    iconBg: "bg-teal-100",
    chipBg: "bg-teal-100",
    border: "border-teal-100",
    ring: "ring-teal-100",
    text: "text-teal-600",
    chipText: "text-teal-700",
    hex: "#0d9488",
  },
  {
    name: "Distinct Cyan",
    rowBg: "bg-cyan-50/70",
    iconBg: "bg-cyan-100",
    chipBg: "bg-cyan-100",
    border: "border-cyan-100",
    ring: "ring-cyan-100",
    text: "text-cyan-600",
    chipText: "text-cyan-700",
    hex: "#0891b2",
  },
  {
    name: "Distinct Lime",
    rowBg: "bg-lime-50/70",
    iconBg: "bg-lime-100",
    chipBg: "bg-lime-100",
    border: "border-lime-100",
    ring: "ring-lime-100",
    text: "text-lime-600",
    chipText: "text-lime-700",
    hex: "#65a30d",
  },
];

const OTHER_TONE = {
  name: "Other",
  rowBg: "bg-slate-50/80",
  iconBg: "bg-slate-100",
  chipBg: "bg-slate-100",
  border: "border-slate-200",
  ring: "ring-slate-200",
  text: "text-slate-600",
  chipText: "text-slate-700",
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
