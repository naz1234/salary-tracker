import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { formatDisplayDate, parseDateOnly, toDateOnly } from "@/utils/cycleFilters";
import { getExpenseDateTone } from "@/utils/expenseDateColors";
import { getExpenseIcon } from "@/utils/expenseIcons";

function fmtCurrency(value = 0) {
  return `⃁ ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatExpenseMetaDate(value) {
  return formatDisplayDate(value);
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

function ExpenseListItem({ expense, onEdit, onDelete, showActions = false }) {
  const Icon = getExpenseIcon(expense.category, expense.description);
  const tone = getExpenseDateTone(expense.date);

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-l-4 ${tone.border} ${tone.rowBg} px-3 py-2.5 shadow-sm`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.iconBg} ${tone.text} ring-1 ${tone.ring}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-900">
          {expense.description || expense.category || "Expense"}
        </p>
        <p className="truncate text-[10px] font-medium text-slate-500">
          {formatExpenseMetaDate(expense.date)} · <span className={`font-semibold ${tone.text}`}>{expense.category || "Uncategorized"}</span>
          {expense.payment_method ? ` · ${expense.payment_method}` : ""}
        </p>
      </div>
      <p className={`shrink-0 text-[13px] font-extrabold ${tone.text}`}>-{fmtCurrency(expense.amount)}</p>
      {showActions ? (
        <div className="flex shrink-0 gap-0.5">
          <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100" onClick={() => onEdit?.(expense)} aria-label="Edit expense">
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <button type="button" className="rounded-lg p-1.5 hover:bg-rose-50" onClick={() => onDelete?.(expense.id)} aria-label="Delete expense">
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
  const [expandedGroupKey, setExpandedGroupKey] = useState(null);

  const toggleGroup = (key) => {
    setExpandedGroupKey((current) => (current === key ? null : key));
  };

  return (
    <div className="space-y-2.5">
      {groupedExpenses.map((group) => {
        const isExpanded = expandedGroupKey === group.key;
        return (
          <div key={group.key} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              onClick={() => toggleGroup(group.key)}
              aria-expanded={isExpanded}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">{formatDisplayDate(group.date)}</p>
                <p className="text-[10px] font-medium text-slate-400">{group.items.length} item{group.items.length > 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-500">Total spending</p>
                <p className="text-[13px] font-extrabold text-emerald-600">-{fmtCurrency(group.total)}</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 px-2.5 pb-2.5 pt-2">
                <div className="space-y-2">
                  {group.items.map((expense) => (
                    <ExpenseListItem
                      key={expense.id}
                      expense={expense}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      showActions={showActions}
                                          />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
