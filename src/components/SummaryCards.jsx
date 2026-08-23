import { Link } from "react-router-dom";
import { Wallet, CreditCard, TrendingDown, PiggyBank, Calendar, Activity } from "lucide-react";
import { parseDateOnly } from "@/utils/cycleFilters";

const toneStyles = {
  emerald: {
    icon: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
    wave: "from-emerald-50 dark:from-emerald-950 via-emerald-100/70 dark:via-emerald-900/70 to-transparent",
    line: "bg-emerald-300/60 dark:bg-emerald-700/60",
  },
  teal: {
    icon: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400",
    wave: "from-teal-50 dark:from-teal-950 via-cyan-100/70 dark:via-cyan-900/70 to-transparent",
    line: "bg-teal-300/60 dark:bg-teal-700/60",
  },
  blue: {
    icon: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    wave: "from-blue-50 dark:from-blue-950 via-blue-100/70 dark:via-blue-900/70 to-transparent",
    line: "bg-blue-300/60 dark:bg-blue-700/60",
  },
  amber: {
    icon: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
    wave: "from-amber-50 dark:from-amber-950 via-orange-100/70 dark:via-orange-900/70 to-transparent",
    line: "bg-amber-300/60 dark:bg-amber-700/60",
  },
  rose: {
    icon: "bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400",
    wave: "from-rose-50 dark:from-rose-950 via-pink-100/70 dark:via-pink-900/70 to-transparent",
    line: "bg-rose-300/60 dark:bg-rose-700/60",
  },
  violet: {
    icon: "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400",
    wave: "from-violet-50 dark:from-violet-950 via-violet-100/70 dark:via-violet-900/70 to-transparent",
    line: "bg-violet-300/60 dark:bg-violet-700/60",
  },
  red: {
    icon: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
    wave: "from-red-50 dark:from-red-950 via-red-100/70 dark:via-red-900/70 to-transparent",
    line: "bg-red-300/60 dark:bg-red-700/60",
  },
};

function Card({ icon: Icon, label, value, tone = "emerald", sub, to }) {
  const style = toneStyles[tone] || toneStyles.emerald;
  const cardClassName = `group relative min-h-[102px] overflow-hidden rounded-[1.2rem] border border-white/80 dark:border-[#202733]/80 bg-white/85 dark:bg-[#090d12]/85 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)] backdrop-blur transition ${
    to
      ? "block cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-300/70 dark:focus:ring-indigo-700/70"
      : ""
  }`;

  const content = (
    <>
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-tr ${style.wave}`} />
      <div className="pointer-events-none absolute -bottom-7 left-10 right-[-20%] h-14 rounded-[100%] border-t border-white/70 dark:border-[#202733]/70 opacity-80" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[12px] font-normal tracking-wide text-slate-600 dark:text-slate-300">{label}</span>
        </div>
        <p className="text-[18px] font-semibold leading-none tracking-[0.04em] text-slate-900 dark:text-slate-100">{value}</p>
        {sub && <p className="mt-1.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">{sub}</p>}
        <div className={`mt-2.5 h-0.5 w-10 rounded-full ${style.line}`} />
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cardClassName} aria-label={`Open ${label} page`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

export default function SummaryCards({ cycle, fixedTotal, expenseTotal }) {
  const salary = cycle?.salary_amount || 0;
  const totalSpent = fixedTotal + expenseTotal;
  const remaining = salary - totalSpent;
  const startDate = cycle?.start_date ? parseDateOnly(cycle.start_date) : null;
  const endDate = cycle?.end_date ? parseDateOnly(cycle.end_date) : new Date();
  const daysSince = startDate && endDate ? Math.max(1, Math.floor((endDate - startDate) / 86400000) + 1) : 0;
  const avgPerDay = daysSince > 0 ? (expenseTotal / daysSince) : 0;

  const fmt = (n) => `⃁ ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Card icon={Wallet} label="Salary" value={fmt(salary)} tone="emerald" />
      <Card
        icon={Activity}
        label="Remaining"
        value={fmt(remaining)}
        tone={remaining >= 0 ? "teal" : "red"}
        sub={remaining < 0 ? "Over budget!" : ""}
      />
      <Card icon={CreditCard} label="Daily Expenses" value={fmt(expenseTotal)} tone="blue" to="/expenses" />
      <Card icon={PiggyBank} label="Fixed Spending" value={fmt(fixedTotal)} tone="amber" to="/fixed" />
      <Card icon={TrendingDown} label="Total Spent" value={fmt(totalSpent)} tone="rose" />
      <Card
        icon={Calendar}
        label="Days / Avg"
        value={`${daysSince} days`}
        tone="violet"
        sub={`~${fmt(avgPerDay)}/day`}
      />
    </div>
  );
}
