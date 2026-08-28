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
    <div className="relative h-[4.4rem] w-[4.4rem] shrink-0" aria-label={`${Math.round(percentage)}% of salary used`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          pathLength="100"
          stroke={overBudget ? "hsl(var(--destructive))" : "hsl(var(--brand-gold))"}
          strokeWidth="10"
          strokeDasharray={`${ringValue} ${100 - ringValue}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-[0.86rem] font-extrabold tabular-nums ${overBudget ? "text-destructive" : "text-foreground"}`}>
          {Math.round(percentage)}%
        </span>
        <span className="mt-0.5 text-[0.58rem] font-semibold text-muted-foreground">used</span>
      </div>
    </div>
  );
}

function SpendingBreakdownLink({ to, icon: Icon, label, value }) {
  return (
    <Link
      to={to}
      className="pika-breakdown group flex min-w-0 items-center gap-2 rounded-[1rem] border border-border/70 px-2.5 py-2.5 transition hover:border-primary/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-primary/[0.11] text-primary ring-1 ring-inset ring-primary/[0.08]">
        <Icon className="h-[0.95rem] w-[0.95rem]" strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.64rem] font-semibold text-muted-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-[clamp(0.66rem,2.7vw,0.82rem)] font-bold tabular-nums text-foreground">{value}</span>
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
    <div className="space-y-3">
      <section className="pika-card pika-cycle-card overflow-hidden rounded-[1.35rem] border border-primary/[0.09] p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-secondary text-brand-plum ring-1 ring-inset ring-brand-plum/10">
            <CalendarDays className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.8rem] font-bold text-foreground">Current Cycle</h2>
            <p className="mt-0.5 truncate text-[0.66rem] font-semibold text-muted-foreground">{cycleRange}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/[0.11] px-2.5 py-1 text-[0.66rem] font-bold text-primary ring-1 ring-inset ring-primary/[0.08]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Active
          </span>
        </div>

        <div className="pika-money-panel mt-3 grid grid-cols-[1fr_1px_1fr] items-stretch gap-3 rounded-[1rem] border px-3 py-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold text-muted-foreground">Salary</p>
            <p className="mt-2 whitespace-nowrap text-[clamp(0.92rem,4vw,1.3rem)] font-extrabold leading-none tracking-tight tabular-nums text-foreground">
              {formatCurrency(salary)}
            </p>
          </div>

          <div className="h-full min-h-[3.9rem] bg-muted/60" />

          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold text-muted-foreground">Remaining</p>
            <p className={`mt-2 whitespace-nowrap text-[clamp(0.9rem,3.8vw,1.2rem)] font-extrabold leading-none tracking-tight tabular-nums ${overBudget ? "text-destructive" : "text-primary"}`}>
              {formatCurrency(remaining)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/55">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${overBudget ? "bg-rose-400" : "bg-gradient-to-r from-emerald-500 to-emerald-300"}`}
                  style={{ width: `${overBudget ? 100 : remainingBar}%` }}
                />
              </div>
              <span className={`text-[0.64rem] font-bold tabular-nums ${overBudget ? "text-destructive" : "text-muted-foreground"}`}>
                {overBudget ? "Over" : `${Math.round(remainingBar)}%`}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pika-card rounded-[1.35rem] border border-border/70 p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-accent text-brand-pink ring-1 ring-inset ring-brand-pink/10">
            <Tag className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.82rem] font-bold text-foreground">Spent This Cycle</h2>
            <p className="mt-2 truncate text-[clamp(1.15rem,5.5vw,1.55rem)] font-extrabold leading-none tracking-tight tabular-nums text-foreground">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <SpendingRing percentage={usedPercentage} overBudget={overBudget} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
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
