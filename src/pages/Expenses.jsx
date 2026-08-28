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
    <div className="pika-expense-stat flex min-w-0 items-center gap-2 rounded-[1rem] border px-2.5 py-2.5">
      <span className="pika-expense-stat-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem]">
        <Icon className="h-[0.95rem] w-[0.95rem]" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.62rem] font-semibold text-muted-foreground">{label}</span>
        <span className="mt-0.5 block break-words text-[clamp(0.7rem,2.9vw,0.88rem)] font-extrabold leading-tight text-foreground">
          {value}
        </span>
        {helper && <span className="mt-0.5 block text-[0.58rem] font-medium text-muted-foreground">{helper}</span>}
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
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="16" />
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
        <span className="text-xs font-semibold text-muted-foreground">Total</span>
        <span className="mt-1 text-lg font-extrabold text-foreground">{fmtCurrency(total)}</span>
      </div>
    </div>
  );
}

function CategoryExpenseDetailRow({ expense, tone }) {
  const Icon = getExpenseIcon(expense.category, expense.description);

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/70 px-2.5 py-2 dark:border-border/70 dark:bg-muted/60">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted ${tone.text} ring-1 ring-border dark:bg-muted/60 dark:ring-border/70`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-foreground">{expense.description || expense.category || "Expense"}</p>
        <p className="truncate text-[9px] font-medium text-muted-foreground">
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
    <div className="pika-card pika-panel-plum rounded-[1.5rem] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-plum/10 text-brand-plum ring-1 ring-inset ring-brand-plum/10">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Expenses by Category</h3>
            <p className="text-[10px] font-medium text-muted-foreground">Tap a category to see its expenses</p>
          </div>
        </div>
      </div>

      {visibleData.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-2xl bg-background dark:bg-card text-xs font-medium text-muted-foreground">
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
                  className={`relative overflow-hidden rounded-2xl border ${tone.border} ${tone.rowBg} dark:!border-transparent dark:!bg-card`}
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
                    <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl ${tone.iconBg} ${tone.text} ring-1 ${tone.ring} dark:!bg-muted dark:!ring-transparent`}>
                      <span
                        className="pointer-events-none absolute inset-0 hidden dark:block"
                        style={{ backgroundColor: `${tone.hex}22` }}
                      />
                      <CategoryIcon className="relative h-4 w-4" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-bold ${tone.text}`}>{item.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{item.count} item{item.count > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-extrabold ${tone.text}`}>{fmtCurrency(item.amount)}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">{percent.toFixed(1)}%</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 ${tone.text} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="relative z-10 border-t border-border/70 dark:border-border/80 px-2.5 pb-2.5 pt-2">
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
            <p className="mt-3 text-center text-[10px] font-medium text-muted-foreground">
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
      <div className="pika-page -mx-4 -mt-4 min-h-[calc(100vh-5rem)] px-4 pb-6 pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">Daily Expenses</h1>
              <p className="text-[11px] font-medium text-muted-foreground">
                {cycle ? `${formatDisplayDate(cycle.start_date)} — ${formatDisplayDate(cycle.end_date)}` : "Overview for salary cycle"}
              </p>
              {cycle && cycle.status !== "active" && (
                <Badge variant="secondary" className="mt-2 rounded-full bg-amber-100 dark:bg-amber-900 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900">
                  Editing Closed Cycle
                </Badge>
              )}
            </div>
            {cycle && (
              <Button className="pika-action h-10 rounded-2xl px-3.5 text-[13px] font-bold text-white" onClick={openAddSheet}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            )}
          </div>

          {cycles.length > 0 && (
            <div className="pika-card pika-panel-mint rounded-[1.25rem] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">Salary Cycle</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Choose which cycle to view</p>
                  </div>
                </div>
                {cycle && (
                  <Badge
                    variant="secondary"
                    className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                      cycle.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-primary hover:bg-emerald-100 dark:hover:bg-emerald-900"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cycle.status === "active" ? "Active" : "Closed"}
                  </Badge>
                )}
              </div>
              <Select value={cycle?.id ? String(cycle.id) : ""} onValueChange={handleCycleChange}>
                <SelectTrigger className="h-11 rounded-2xl border-primary/25 bg-card px-3 text-[12px] font-semibold text-foreground shadow-sm focus:ring-ring">
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
            <p className="rounded-[1.5rem] bg-card p-5 text-center text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-border/70">
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
            <div className="rounded-[1.5rem] bg-card p-8 text-center shadow-sm ring-1 ring-border/70">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-primary">
                <ReceiptText className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-base font-extrabold text-foreground">No expenses yet</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs font-medium text-muted-foreground">Tap Add to record your spending and view the expense overview here.</p>
              <Button className="pika-action mt-5 h-11 rounded-2xl px-6 font-bold text-white" onClick={openAddSheet}>
                <Plus className="mr-1 h-4 w-4" /> Add Expense
              </Button>
            </div>
          ) : cycle ? (
            <>
              <div className="grid grid-cols-3 rounded-[1.2rem] bg-card p-1 shadow-sm ring-1 ring-border/70">
                {["overview", "transactions", "categories"].map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={`rounded-2xl px-2 py-2 text-[11px] font-extrabold capitalize transition-all ${
                      activeView === view
                        ? "pika-action text-white ring-1 ring-inset ring-primary/20"
                        : "text-muted-foreground hover:bg-background"
                    }`}
                    onClick={() => setActiveView(view)}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {activeView === "overview" && (
                <div className="space-y-3">
                  <section className="pika-card pika-panel-gold rounded-[1.35rem] p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-brand-gold/10 text-brand-gold ring-1 ring-inset ring-brand-gold/10">
                        <TrendingDown className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[0.82rem] font-bold text-foreground">Total Expenses</h2>
                        <p className="mt-1.5 truncate text-[clamp(1.15rem,5.5vw,1.55rem)] font-extrabold leading-none tracking-tight tabular-nums text-foreground">
                          {fmtCurrency(overview.total)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-gold/10 px-2.5 py-1 text-[0.66rem] font-bold text-brand-gold ring-1 ring-inset ring-brand-gold/10">
                        {expenses.length} item{expenses.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="pika-expense-stats mt-3 grid grid-cols-2 gap-2">
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

                  <div className="pika-card pika-panel-sky rounded-[1.5rem] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="pika-panel-sky-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl">
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold text-foreground">Recent Transactions</h3>
                        </div>
                      </div>
                      <button type="button" className="pika-panel-sky-link text-[11px] font-medium" onClick={() => setActiveView("transactions")}>View all</button>
                    </div>
                    <GroupedExpenseSections expenses={overview.recent} compact />
                  </div>

                  <div className="pika-card pika-panel-gold flex items-center justify-between rounded-[1.25rem] p-4">
                    <p className="text-xs font-extrabold text-foreground">Total ({expenses.length} item{expenses.length > 1 ? "s" : ""})</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">{fmtCurrency(overview.total)}</p>
                  </div>
                </div>
              )}

              {activeView === "transactions" && (
                <div className="space-y-3">
                  <div className="pika-card pika-panel-pink rounded-[1.25rem] p-3">
                    <p className="text-[13px] font-medium text-foreground">All Daily Expenses</p>
                    <p className="text-[11px] font-normal text-muted-foreground">Viewing {cycle ? `${formatDisplayDate(cycle.start_date)} — ${cycle.end_date ? formatDisplayDate(cycle.end_date) : "Current"}` : "selected salary cycle"}.</p>
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
          className="w-full max-w-full touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none overscroll-y-contain rounded-t-3xl bg-card max-h-[90dvh]"
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
