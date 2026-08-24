import { Link } from "react-router-dom";
import { CalendarDays, ShieldCheck, Tag } from "lucide-react";
import { formatDisplayDate } from "@/utils/cycleFilters";

function formatCurrency(value = 0) {
  return `RM ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function SpendingRing({ percentage, overBudget }) {
  const ringValue = clampPercentage(percentage);

  return (
    <div className="relative h-[5.6rem] w-[5.6rem] shrink-0" aria-label={`${Math.round(percentage)}% of salary used`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth="11"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          pathLength="100"
          stroke={overBudget ? "#fb7185" : "#2ee68a"}
          strokeWidth="11"
          strokeDasharray={`${ringValue} ${100 - ringValue}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-[1.05rem] font-extrabold tabular-nums ${overBudget ? "text-rose-300" : "text-white"}`}>
          {Math.round(percentage)}%
        </span>
        <span className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">used</span>
      </div>
    </div>
  );
}

function SpendingBreakdownLink({ to, icon: Icon, label, value }) {
  return (
    <Link
      to={to}
      className="group flex min-w-0 items-center gap-2.5 rounded-[1.15rem] border border-white/[0.07] bg-black/10 px-3 py-3 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.04] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-400/[0.11] text-emerald-400 ring-1 ring-inset ring-emerald-400/[0.08]">
        <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.72rem] font-semibold text-slate-400">{label}</span>
        <span className="mt-0.5 block truncate text-[clamp(0.72rem,3.2vw,0.95rem)] font-bold tabular-nums text-white">{value}</span>
      </span>
    </Link>
  );
}

export default function SummaryCards({ cycle, fixedTotal, expenseTotal }) {
  const salary = Number(cycle?.salary_amount || 0);
  const totalSpent = Number(fixedTotal || 0) + Number(expenseTotal || 0);
  const remaining = salary - totalSpent;
  const usedPercentage = salary > 0 ? (totalSpent / salary) * 100 : 0;
  const remainingPercentage = salary > 0 ? (remaining / salary) * 100 : 0;
  const remainingBar = clampPercentage(remainingPercentage);
  const overBudget = remaining < 0;
  const cycleRange = cycle?.end_date
    ? `${formatDisplayDate(cycle.start_date)} — ${formatDisplayDate(cycle.end_date)}`
    : `${formatDisplayDate(cycle?.start_date)} — Current`;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.75rem] border border-emerald-300/[0.09] bg-[linear-gradient(135deg,rgba(5,62,43,0.78)_0%,rgba(8,21,22,0.94)_48%,rgba(7,16,19,0.98)_100%)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.05rem] bg-emerald-400/[0.12] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.08]">
            <CalendarDays className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.92rem] font-bold text-slate-300">Current Cycle</h2>
            <p className="mt-0.5 truncate text-[0.75rem] font-semibold text-slate-400">{cycleRange}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/[0.11] px-3 py-1.5 text-[0.74rem] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/[0.08]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(46,230,138,0.75)]" />
            Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1px_1fr] items-stretch gap-4 rounded-[1.35rem] border border-white/[0.07] bg-black/[0.13] px-4 py-4">
          <div className="min-w-0">
            <p className="text-[0.78rem] font-semibold text-slate-400">Salary</p>
            <p className="mt-2 whitespace-nowrap text-[clamp(1.05rem,4.8vw,1.6rem)] font-extrabold leading-none tracking-tight tabular-nums text-white">
              {formatCurrency(salary)}
            </p>
          </div>

          <div className="h-full min-h-[4.8rem] bg-white/[0.09]" />

          <div className="min-w-0">
            <p className="text-[0.78rem] font-semibold text-slate-400">Remaining</p>
            <p className={`mt-2 whitespace-nowrap text-[clamp(1rem,4.5vw,1.45rem)] font-extrabold leading-none tracking-tight tabular-nums ${overBudget ? "text-rose-300" : "text-emerald-400"}`}>
              {formatCurrency(remaining)}
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700/55">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${overBudget ? "bg-rose-400" : "bg-gradient-to-r from-emerald-500 to-emerald-300"}`}
                  style={{ width: `${overBudget ? 100 : remainingBar}%` }}
                />
              </div>
              <span className={`text-[0.72rem] font-bold tabular-nums ${overBudget ? "text-rose-300" : "text-slate-400"}`}>
                {overBudget ? "Over" : `${Math.round(remainingBar)}%`}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(12,23,27,0.97),rgba(5,13,17,0.99))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.05rem] bg-emerald-400/[0.11] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.07]">
            <Tag className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.98rem] font-bold text-white">Spent This Cycle</h2>
            <p className="mt-2 truncate text-[clamp(1.45rem,7vw,2rem)] font-extrabold leading-none tracking-tight tabular-nums text-white">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <SpendingRing percentage={usedPercentage} overBudget={overBudget} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <SpendingBreakdownLink
            to="/expenses"
            icon={CalendarDays}
            label="Daily Expenses"
            value={formatCurrency(expenseTotal)}
          />
          <SpendingBreakdownLink
            to="/fixed"
            icon={ShieldCheck}
            label="Fixed Spending"
            value={formatCurrency(fixedTotal)}
          />
        </div>
      </section>
    </div>
  );
}
