import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { formatDisplayDate, parseDateOnly, toDateOnly } from "@/utils/cycleFilters";
import { getExpenseCategoryPaletteTone } from "@/utils/expenseCategoryColors";
import { getExpenseIcon } from "@/utils/expenseIcons";

const DATE_GROUP_TONES = [
  {
    rowBg: "bg-white dark:bg-slate-900",
    iconBg: "bg-slate-50 dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-700",
    ring: "ring-slate-200 dark:ring-slate-700",
    text: "text-slate-700 dark:text-slate-200",
  },
  {
    rowBg: "bg-slate-100/80 dark:bg-slate-800/80",
    iconBg: "bg-slate-200/80 dark:bg-slate-700/80",
    border: "border-slate-200 dark:border-slate-700",
    ring: "ring-slate-300 dark:ring-slate-600",
    text: "text-slate-700 dark:text-slate-200",
  },
];

function fmtCurrency(value = 0) {
  return `⃁ ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeCategory(category = "") {
  return String(category || "Uncategorized")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function groupExpensesByDate(expenses = []) {
  const map = new Map();

  [...expenses]
    .sort((a, b) => (parseDateOnly(b.date) || 0) - (parseDateOnly(a.date) || 0))
    .forEach((expense) => {
      const key = toDateOnly(expense.date) || "unknown";
      const current = map.get(key) || {
        key,
        date: expense.date,
        total: 0,
        items: [],
      };
      current.total += Number(expense.amount || 0);
      current.items.push(expense);
      map.set(key, current);
    });

  return Array.from(map.values());
}

function buildCategoryToneMap(expenses = []) {
  const categoryTotals = new Map();

  expenses.forEach((expense) => {
    const key = normalizeCategory(expense.category);
    const current = categoryTotals.get(key) || {
      key,
      label: expense.category || "Uncategorized",
      total: 0,
    };
    current.total += Number(expense.amount || 0);
    categoryTotals.set(key, current);
  });

  const orderedCategories = Array.from(categoryTotals.values()).sort((a, b) => b.total - a.total);
  const toneMap = new Map();

  orderedCategories.forEach((item, index) => {
    toneMap.set(item.key, getExpenseCategoryPaletteTone(index));
  });

  return toneMap;
}

function ExpenseListItem({ expense, tone, onEdit, onDelete, showActions = false }) {
  const Icon = getExpenseIcon(expense.category, expense.description);

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-l-4 ${tone.border} ${tone.rowBg} px-3 py-2.5 shadow-sm`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.iconBg} ${tone.text} ring-1 ${tone.ring}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
          {expense.description || expense.category || "Expense"}
        </p>
        <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
          <span className={`font-semibold ${tone.text}`}>{expense.category || "Uncategorized"}</span>
          {expense.payment_method ? ` · ${expense.payment_method}` : ""}
        </p>
      </div>
      <p className={`shrink-0 text-[13px] font-extrabold ${tone.text}`}>-{fmtCurrency(expense.amount)}</p>
      {showActions ? (
        <div className="flex shrink-0 gap-0.5">
          <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onEdit?.(expense)} aria-label="Edit expense">
            <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </button>
          <button type="button" className="rounded-lg p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950" onClick={() => onDelete?.(expense.id)} aria-label="Delete expense">
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function GroupedExpenseSections({
  expenses = [],
  onEdit,
  onDelete,
  showActions = false,
}) {
  const groupedExpenses = useMemo(() => groupExpensesByDate(expenses), [expenses]);
  const categoryToneMap = useMemo(() => buildCategoryToneMap(expenses), [expenses]);
  const [expandedGroupKey, setExpandedGroupKey] = useState(null);

  const toggleGroup = (key) => {
    setExpandedGroupKey((current) => (current === key ? null : key));
  };

  return (
    <div className="space-y-2.5">
      {groupedExpenses.map((group, groupIndex) => {
        const isExpanded = expandedGroupKey === group.key;
        const headerTone = DATE_GROUP_TONES[groupIndex % DATE_GROUP_TONES.length];
        return (
          <div key={group.key} className={`overflow-hidden rounded-2xl border ${headerTone.border} bg-white dark:bg-slate-900 shadow-sm`}>
            <button
              type="button"
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${headerTone.rowBg}`}
              onClick={() => toggleGroup(group.key)}
              aria-expanded={isExpanded}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${headerTone.iconBg} ${headerTone.text} ring-1 ${headerTone.ring}`}>
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[13px] font-semibold ${headerTone.text}`}>{formatDisplayDate(group.date)}</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{group.items.length} item{group.items.length > 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total spending</p>
                <p className={`text-[13px] font-extrabold ${headerTone.text}`}>-{fmtCurrency(group.total)}</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 ${headerTone.text} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
              <div className={`border-t ${headerTone.border} bg-white dark:bg-slate-900 px-2.5 pb-2.5 pt-2`}>
                <div className="space-y-2">
                  {group.items.map((expense) => {
                    const expenseTone = categoryToneMap.get(normalizeCategory(expense.category)) || getExpenseCategoryPaletteTone(0);
                    return (
                      <ExpenseListItem
                        key={expense.id}
                        expense={expense}
                        tone={expenseTone}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        showActions={showActions}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
