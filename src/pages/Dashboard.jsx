import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cloudflare } from "@/api/cloudflareClient";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, CalendarDays, ChevronRight, Clock3, Plus } from "lucide-react";
import MobileLayout from "../components/MobileLayout";
import SummaryCards from "../components/SummaryCards";
import { filterExpensesForCycle, formatDisplayDate, getRecentExpensesByDays } from "@/utils/cycleFilters";
import { getExpenseIcon } from "@/utils/expenseIcons";

const DASHBOARD_CACHE_KEY = "salary-cycle-dashboard-cache-v1";

function normalizeDashboardPayload(payload) {
  return {
    cycle: payload?.cycle || null,
    fixed: Array.isArray(payload?.fixed) ? payload.fixed.filter((item) => !item.is_skipped) : [],
    expenses: Array.isArray(payload?.expenses) ? payload.expenses : [],
  };
}

function readDashboardCache() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch {
    return null;
  }
}

function saveDashboardCache(data) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), data })
    );
  } catch {
    // Cache is only a speed/fallback helper. Ignore storage errors.
  }
}

function formatCurrency(value = 0) {
  return `RM ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function DashboardSurface({ children }) {
  return (
    <div className="relative -mx-4 -mb-6 -mt-4 min-h-[calc(100dvh-env(safe-area-inset-top))] overflow-hidden bg-[#02070a] px-3 pb-8 pt-3 text-white">
      <div className="pointer-events-none absolute inset-x-[-30%] top-[-10rem] h-[25rem] rounded-full bg-emerald-500/[0.055] blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-72 h-64 w-64 rounded-full bg-emerald-500/[0.035] blur-3xl" />
      <div className="relative mx-auto max-w-sm">{children}</div>
    </div>
  );
}

function RecentTransaction({ expense }) {
  const Icon = getExpenseIcon(expense.category, expense.description);

  return (
    <Link
      to="/expenses"
      className="group flex items-center gap-2.5 rounded-[1rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(12,23,27,0.97),rgba(5,13,17,0.99))] px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.03] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-emerald-400/[0.1] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.07]">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8rem] font-bold text-white">
          {expense.description || expense.category || "Expense"}
        </span>
        <span className="mt-0.5 block truncate text-[0.64rem] font-semibold text-slate-400">
          {expense.category || "Uncategorized"}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[0.64rem] font-semibold text-slate-400">
          {formatDisplayDate(expense.date)}
        </span>
        <span className="mt-0.5 block text-[0.8rem] font-extrabold tabular-nums text-white">
          -{formatCurrency(expense.amount)}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
    </Link>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);
  const [fixed, setFixed] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");
  const [error, setError] = useState("");

  const applyDashboardData = useCallback((payload, cached = false) => {
    const data = normalizeDashboardPayload(payload);
    setCycle(data.cycle);
    setFixed(data.cycle ? data.fixed : []);
    setExpenses(data.cycle ? filterExpensesForCycle(data.expenses, data.cycle) : []);
    setFromCache(cached);
  }, []);

  const loadDashboard = useCallback(
    async ({ useCache = true } = {}) => {
      let cachedApplied = false;
      setError("");
      setSyncNotice("");

      if (useCache) {
        const cached = readDashboardCache();
        if (cached) {
          applyDashboardData(cached, true);
          cachedApplied = true;
          setLoading(false);
        }
      }

      if (!cachedApplied) setLoading(true);

      try {
        const latest = await cloudflare.dashboard.get();
        applyDashboardData(latest, false);
        saveDashboardCache(latest);
      } catch (err) {
        console.error("Failed to load dashboard", err);
        if (cachedApplied) {
          setSyncNotice("Showing saved dashboard. Cloudflare is slow right now; tap Refresh to try again.");
        } else {
          setError(err?.message || "Dashboard failed to load.");
        }
      } finally {
        setLoading(false);
      }
    },
    [applyDashboardData]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const fixedTotal = fixed.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const recentExpenses = getRecentExpensesByDays(expenses, 3).slice(0, 3);

  if (loading) {
    return (
      <MobileLayout>
        <DashboardSurface>
          <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            <p className="text-sm font-medium text-slate-400">Loading dashboard…</p>
          </div>
        </DashboardSurface>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <DashboardSurface>
          <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/[0.1] text-xl font-bold text-rose-300 ring-1 ring-inset ring-rose-400/20">
              !
            </div>
            <h1 className="mt-4 text-lg font-bold text-white">Dashboard cannot load</h1>
            <p className="mt-2 max-w-xs break-words text-sm text-slate-400">{error}</p>
            <Button
              className="mt-5 h-11 rounded-2xl bg-emerald-500 px-7 font-bold text-white hover:bg-emerald-400"
              onClick={() => loadDashboard({ useCache: false })}
            >
              Refresh
            </Button>
          </div>
        </DashboardSurface>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <DashboardSurface>
        <div className="space-y-3">
          <header className="flex items-start justify-between gap-2 pb-0.5">
            <div>
              <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-tight text-white">Dashboard</h1>
              <p className="mt-0.5 text-[0.75rem] font-semibold text-slate-400">Spending Tracker</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/cycles")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-white/[0.06] bg-white/[0.045] text-emerald-400 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.08] active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              aria-label="Open salary cycles"
            >
              <CalendarDays className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
            </button>
          </header>

          {(fromCache || syncNotice) && (
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.07] px-3 py-2.5 text-[0.68rem] leading-5 text-amber-100">
              {syncNotice || "Showing saved dashboard while Cloudflare refreshes in the background."}
            </div>
          )}

          {!cycle ? (
            <section className="rounded-[1.35rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(12,23,27,0.97),rgba(5,13,17,0.99))] p-5 text-center shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-emerald-400/[0.11] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.08]">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-white">No Active Cycle</h2>
              <p className="mx-auto mt-1.5 max-w-xs text-[0.74rem] leading-5 text-slate-400">
                Create your first salary cycle to start tracking salary, fixed commitments, and daily expenses.
              </p>
              <Button
                className="mt-4 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 text-[0.8rem] font-bold text-white shadow-[0_12px_28px_rgba(16,185,129,0.18)] hover:from-emerald-500 hover:to-emerald-400"
                onClick={() => navigate("/cycles?new=1")}
              >
                Start New Salary Cycle
              </Button>
            </section>
          ) : (
            <>
              <SummaryCards cycle={cycle} fixedTotal={fixedTotal} expenseTotal={expenseTotal} />

              <Button
                className="h-[2.85rem] w-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-[0.84rem] font-extrabold text-white shadow-[0_14px_30px_rgba(16,185,129,0.17)] ring-1 ring-inset ring-emerald-300/10 transition hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-600 active:scale-[0.99]"
                onClick={() => navigate("/expenses?add=1")}
              >
                <Plus className="mr-1 h-4 w-4 text-emerald-300" strokeWidth={2.4} /> Add Expense
              </Button>

              <section className="pt-0.5">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-emerald-400/[0.1] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.07]">
                      <Clock3 className="h-[1rem] w-[1rem]" strokeWidth={2.2} />
                    </span>
                    <h2 className="text-[0.9rem] font-extrabold text-white">Recent Transactions</h2>
                  </div>
                  <Link
                    to="/expenses"
                    className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-emerald-400 transition hover:text-emerald-300"
                  >
                    View All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {recentExpenses.length > 0 ? (
                  <div className="space-y-2">
                    {recentExpenses.map((expense, index) => (
                      <RecentTransaction key={expense.id || `${expense.date}-${index}`} expense={expense} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-white/[0.09] bg-white/[0.025] px-4 py-6 text-center text-[0.74rem] font-medium text-slate-500">
                    No expenses recorded in this cycle yet.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </DashboardSurface>
    </MobileLayout>
  );
}
