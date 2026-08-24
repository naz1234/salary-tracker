import { useMemo, useState, useEffect } from "react";
import { cloudflare } from "@/api/cloudflareClient";
import { filterExpensesForCycle, formatDisplayDate, getRecentExpensesByDays, isDateInSalaryCycle } from "@/utils/cycleFilters";
import { getExpenseCategoryPaletteHex, getExpenseCategoryPaletteTone } from "@/utils/expenseCategoryColors";
import { getExpenseIcon } from "@/utils/expenseIcons";
import GroupedExpenseSections from "@/components/GroupedExpenseSections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  PieChart,
  Plus,
  ReceiptText,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import MobileLayout from "../components/MobileLayout";
import ExpenseForm from "../components/ExpenseForm";

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function fmtDate(value, withYear = false) {
  const date = parseLocalDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function fmtCurrency(value = 0) {
  return `⃁ ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getDaysBetween(start, end) {
  if (!start || !end) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end - start) / oneDay) + 1);
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[1rem] border border-white/[0.07] bg-black/10 px-2.5 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-emerald-400/[0.11] text-emerald-400 ring-1 ring-inset ring-emerald-400/[0.08]">
        <Icon className="h-[0.95rem] w-[0.95rem]" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.62rem] font-semibold text-slate-400">{label}</span>
        <span className="mt-0.5 block break-words text-[clamp(0.7rem,2.9vw,0.88rem)] font-extrabold leading-tight text-white">
          {value}
        </span>
        {helper && <span className="mt-0.5 block text-[0.58rem] font-medium text-slate-500">{helper}</span>}
      </span>
    </div>
  );
}

function DonutChart({ data, total }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative mx-auto h-48 w-48">
      <svg className="h-full w-full" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {data.map((item, index) => {
          const slice = total > 0 ? (item.amount / total) * circumference : 0;
          const strokeDashoffset = -offset;
          offset += slice;
          return (
            <circle
              key={item.name}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="16"
              strokeDasharray={`${slice} ${circumference - slice}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Total</span>
        <span className="mt-1 text-lg font-extrabold text-slate-950 dark:text-slate-50">{fmtCurrency(total)}</span>
      </div>
    </div>
  );
}

function CategoryExpenseDetailRow({ expense, tone }) {
  const Icon = getExpenseIcon(expense.category, expense.description);

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-2 dark:border-white/[0.07] dark:bg-white/[0.025]">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 ${tone.text} ring-1 ring-slate-200 dark:bg-white/[0.05] dark:ring-white/[0.07]`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">{expense.description || expense.category || "Expense"}</p>
        <p className="truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
          {fmtDate(expense.date, true)}{expense.payment_method ? ` · ${expense.payment_method}` : ""}
        </p>
      </div>
      <p className={`shrink-0 text-[11px] font-extrabold ${tone.text}`}>-{fmtCurrency(expense.amount)}</p>
    </div>
  );
}

function CategoryBreakdown({ data, total, compact = false }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const visibleData = compact ? data.slice(0, 5) : data;

  const toggleCategory = (categoryName) => {
    setExpandedCategory((current) => (current === categoryName ? null : categoryName));
  };

  return (
    <div className="rounded-[1.5rem] bg-white dark:bg-[#090d12] p-4 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-slate-50">Expenses by Category</h3>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Tap a category to see its expenses</p>
          </div>
        </div>
      </div>

      {visibleData.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-50 dark:bg-[#090d12] text-xs font-medium text-slate-400 dark:text-slate-500">
          No category data yet.
        </div>
      ) : (
        <>
          {!compact && <DonutChart data={visibleData} total={total} />}
          <div className={compact ? "space-y-2" : "mt-2 space-y-2"}>
            {visibleData.map((item, index) => {
              const percent = total > 0 ? (item.amount / total) * 100 : 0;
              const tone = getExpenseCategoryPaletteTone(item.colorIndex ?? index);
              const CategoryIcon = getExpenseIcon(item.name);
              const isExpanded = expandedCategory === item.name;
              return (
                <div
                  key={item.name}
                  className={`relative overflow-hidden rounded-2xl border ${tone.border} ${tone.rowBg} dark:!border-transparent dark:!bg-[#090d12]`}
                >
                  <div
                    className="pointer-events-none absolute inset-0 hidden rounded-2xl border dark:block"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${tone.hex}20 0%, ${tone.hex}0a 52%, transparent 100%)`,
                      borderColor: `${tone.hex}55`,
                    }}
                  />
                  <button
                    type="button"
                    className="relative z-10 flex w-full items-center gap-3 px-3 py-2.5 text-left"
                    onClick={() => toggleCategory(item.name)}
                    aria-expanded={isExpanded}
                  >
                    <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl ${tone.iconBg} ${tone.text} ring-1 ${tone.ring} dark:!bg-[#10151c] dark:!ring-transparent`}>
                      <span
                        className="pointer-events-none absolute inset-0 hidden dark:block"
                        style={{ backgroundColor: `${tone.hex}22` }}
                      />
                      <CategoryIcon className="relative h-4 w-4" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-bold ${tone.text}`}>{item.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{item.count} item{item.count > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-extrabold ${tone.text}`}>{fmtCurrency(item.amount)}</p>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{percent.toFixed(1)}%</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 ${tone.text} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="relative z-10 border-t border-white/80 dark:border-[#202733]/80 px-2.5 pb-2.5 pt-2">
                      <div className="space-y-1.5">
                        {item.expenses.map((expense, index) => (
                          <CategoryExpenseDetailRow key={expense.id || `${item.name}-${index}`} expense={expense} tone={tone} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {compact && data.length > visibleData.length && (
            <p className="mt-3 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Showing top {visibleData.length} of {data.length} categories.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function Expenses() {
  const [cycle, setCycle] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [activeView, setActiveView] = useState("overview");

  const getUrlParams = () => new URLSearchParams(window.location.search);

  useEffect(() => {
    const params = getUrlParams();
    load(params.get("cycleId"));
  }, []);

  useEffect(() => {
    const params = getUrlParams();
    if (params.get("add") === "1" && cycle) {
      setSheetOpen(true);
      params.delete("add");
      const nextQuery = params.toString();
      window.history.replaceState({}, "", nextQuery ? `/expenses?${nextQuery}` : "/expenses");
    }
  }, [cycle]);

  const load = async (requestedCycleId = null) => {
    setLoading(true);
    try {
      const allCycles = await cloudflare.entities.SalaryCycle.list("-start_date", 50);
      setCycles(allCycles);

      const selectedCycle = requestedCycleId
        ? allCycles.find((item) => String(item.id) === String(requestedCycleId))
        : allCycles.find((item) => item.status === "active") || allCycles[0] || null;

      if (selectedCycle) {
        setCycle(selectedCycle);
        const e = await cloudflare.entities.Expense.filter({ salary_cycle_id: selectedCycle.id }, "-date");
        setExpenses(filterExpensesForCycle(e, selectedCycle));
      } else {
        setCycle(null);
        setExpenses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCycleChange = async (cycleId) => {
    const params = getUrlParams();
    params.set("cycleId", cycleId);
    params.delete("add");
    window.history.replaceState({}, "", `/expenses?${params.toString()}`);
    setEditing(null);
    setDeleteId(null);
    await load(cycleId);
  };

  const handleSubmit = async (data) => {
    if (!isDateInSalaryCycle(data.date, cycle)) {
      const start = cycle?.start_date || "the cycle start date";
      const end = cycle?.end_date || "the next salary cycle";
      alert(`Expense date must be within the selected salary cycle (${start} to ${end}).`);
      return;
    }

    setSaving(true);
    if (editing) {
      await cloudflare.entities.Expense.update(editing.id, data);
    } else {
      await cloudflare.entities.Expense.create({ ...data, salary_cycle_id: cycle.id });
    }
    setSheetOpen(false);
    setEditing(null);
    setSaving(false);
    await load(cycle?.id);
  };

  const handleDelete = async () => {
    await cloudflare.entities.Expense.delete(deleteId);
    setDeleteId(null);
    await load(cycle?.id);
  };

  const handleEdit = (expense) => {
    setEditing(expense);
    setSheetOpen(true);
  };

  const overview = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const sortedAsc = [...expenses].sort((a, b) => (parseLocalDate(a.date) || 0) - (parseLocalDate(b.date) || 0));
    const firstDate = sortedAsc[0]?.date;
    const lastDate = sortedAsc[sortedAsc.length - 1]?.date;
    const rangeDays = getDaysBetween(parseLocalDate(firstDate), parseLocalDate(lastDate));
    const averagePerDay = rangeDays > 0 ? total / rangeDays : 0;

    const byCategoryMap = new Map();
    expenses.forEach((item) => {
      const key = item.category || "Uncategorized";
      const current = byCategoryMap.get(key) || { name: key, amount: 0, count: 0, expenses: [] };
      current.amount += Number(item.amount || 0);
      current.count += 1;
      current.expenses.push(item);
      byCategoryMap.set(key, current);
    });
    const byCategory = Array.from(byCategoryMap.values())
      .map((item) => ({
        ...item,
        expenses: [...item.expenses].sort((a, b) => (parseLocalDate(b.date) || 0) - (parseLocalDate(a.date) || 0)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({
        ...item,
        colorIndex: index,
        color: getExpenseCategoryPaletteHex(index),
      }));

    return {
      total,
      firstDate,
      lastDate,
      rangeDays,
      averagePerDay,
      byCategory,
      recent: getRecentExpensesByDays(expenses, 3),
    };
  }, [expenses]);

  const openAddSheet = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  return (
    <MobileLayout>
      <div className="-mx-4 -mt-4 min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 pb-6 pt-4 text-slate-950 dark:from-[#05080c] dark:via-[#05080c] dark:to-[#030609] dark:text-slate-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">Daily Expenses</h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {cycle ? `${formatDisplayDate(cycle.start_date)} — ${formatDisplayDate(cycle.end_date)}` : "Overview for salary cycle"}
              </p>
              {cycle && cycle.status !== "active" && (
                <Badge variant="secondary" className="mt-2 rounded-full bg-amber-100 dark:bg-amber-900 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900">
                  Editing Closed Cycle
                </Badge>
              )}
            </div>
            {cycle && (
              <Button className="h-10 rounded-2xl bg-emerald-500 px-3.5 text-[13px] font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600" onClick={openAddSheet}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            )}
          </div>

          {cycles.length > 0 && (
            <div className="rounded-[1.25rem] bg-white dark:bg-[#090d12] p-3 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">Salary Cycle</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Choose which cycle to view</p>
                  </div>
                </div>
                {cycle && (
                  <Badge
                    variant="secondary"
                    className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                      cycle.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cycle.status === "active" ? "Active" : "Closed"}
                  </Badge>
                )}
              </div>
              <Select value={cycle?.id ? String(cycle.id) : ""} onValueChange={handleCycleChange}>
                <SelectTrigger className="h-11 rounded-2xl border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/60 px-3 text-[12px] font-semibold text-slate-800 dark:text-slate-200 shadow-sm focus:ring-emerald-300 dark:focus:ring-emerald-700">
                  <SelectValue placeholder="Select salary cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)} className="text-[12px]">
                      {formatDisplayDate(item.start_date)} — {item.end_date ? formatDisplayDate(item.end_date) : "Current"}
                      {item.status === "active" ? " · Active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!cycle && !loading && (
            <p className="rounded-[1.5rem] bg-white dark:bg-[#090d12] p-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
              No salary cycle selected. Create one first from the Dashboard or open one from Salary Cycles.
            </p>
          )}

          {cycle && cycle.status !== "active" && (
            <div className="rounded-[1.35rem] border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 text-xs font-medium text-amber-700 dark:text-amber-300">
              You are editing a closed/previous salary cycle. New expenses will be saved only inside this selected cycle.
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : expenses.length === 0 && cycle ? (
            <div className="rounded-[1.5rem] bg-white dark:bg-[#090d12] p-8 text-center shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <ReceiptText className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-base font-extrabold text-slate-950 dark:text-slate-50">No expenses yet</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs font-medium text-slate-500 dark:text-slate-400">Tap Add to record your spending and view the expense overview here.</p>
              <Button className="mt-5 h-11 rounded-2xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600" onClick={openAddSheet}>
                <Plus className="mr-1 h-4 w-4" /> Add Expense
              </Button>
            </div>
          ) : cycle ? (
            <>
              <div className="grid grid-cols-3 rounded-[1.2rem] bg-white dark:bg-[#090d12] p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
                {["overview", "transactions", "categories"].map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={`rounded-2xl px-2 py-2 text-[11px] font-extrabold capitalize transition-all ${
                      activeView === view
                        ? "bg-emerald-500 text-white shadow-sm dark:bg-emerald-500/10 dark:ring-1 dark:ring-inset dark:ring-emerald-500/55 dark:shadow-[0_0_20px_rgba(16,185,129,0.10)]"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                    onClick={() => setActiveView(view)}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {activeView === "overview" && (
                <div className="space-y-3">
                  <section className="rounded-[1.35rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(12,23,27,0.97),rgba(5,13,17,0.99))] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-400/[0.11] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.07]">
                        <TrendingDown className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[0.82rem] font-bold text-white">Total Expenses</h2>
                        <p className="mt-1.5 truncate text-[clamp(1.15rem,5.5vw,1.55rem)] font-extrabold leading-none tracking-tight tabular-nums text-white">
                          {fmtCurrency(overview.total)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-400/[0.1] px-2.5 py-1 text-[0.66rem] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/[0.08]">
                        {expenses.length} item{expenses.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <StatCard icon={ReceiptText} label="Transactions" value={expenses.length} />
                      <StatCard icon={WalletCards} label="Average per Day" value={fmtCurrency(overview.averagePerDay)} />
                      <StatCard
                        icon={CalendarDays}
                        label="Date Range"
                        value={overview.firstDate ? `${fmtDate(overview.firstDate)} – ${fmtDate(overview.lastDate)}` : "—"}
                        helper={overview.rangeDays ? `${overview.rangeDays} day${overview.rangeDays > 1 ? "s" : ""}` : ""}
                      />
                      <StatCard icon={PieChart} label="Categories" value={overview.byCategory.length} helper="Spending groups" />
                    </div>
                  </section>

                  <CategoryBreakdown data={overview.byCategory} total={overview.total} compact />

                  <div className="rounded-[1.5rem] bg-white dark:bg-[#090d12] p-4 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Recent Transactions</h3>
                        </div>
                      </div>
                      <button type="button" className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400" onClick={() => setActiveView("transactions")}>View all</button>
                    </div>
                    <GroupedExpenseSections expenses={overview.recent} compact />
                  </div>

                  <div className="flex items-center justify-between rounded-[1.25rem] bg-white dark:bg-[#090d12] p-4 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Total ({expenses.length} item{expenses.length > 1 ? "s" : ""})</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">{fmtCurrency(overview.total)}</p>
                  </div>
                </div>
              )}

              {activeView === "transactions" && (
                <div className="space-y-3">
                  <div className="rounded-[1.25rem] bg-white dark:bg-[#090d12] p-3 shadow-sm ring-1 ring-slate-200/70 dark:ring-[#202733]/70">
                    <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">All Daily Expenses</p>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Viewing {cycle ? `${formatDisplayDate(cycle.start_date)} — ${cycle.end_date ? formatDisplayDate(cycle.end_date) : "Current"}` : "selected salary cycle"}.</p>
                  </div>
                  <GroupedExpenseSections expenses={expenses} onEdit={handleEdit} onDelete={setDeleteId} showActions />
                </div>
              )}

              {activeView === "categories" && (
                <CategoryBreakdown data={overview.byCategory} total={overview.total} />
              )}
            </>
          ) : null}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setEditing(null); }}>
        <SheetContent
          side="bottom"
          className="w-full max-w-full touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none overscroll-y-contain rounded-t-3xl max-h-[90dvh]"
        >
          <SheetHeader className="min-w-0"><SheetTitle>{editing ? "Edit Expense" : "Add Expense"}</SheetTitle></SheetHeader>
          <div className="mt-4 w-full min-w-0 max-w-full overflow-x-hidden pb-6">
            <ExpenseForm onSubmit={handleSubmit} initial={editing} loading={saving} cycle={cycle} />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
