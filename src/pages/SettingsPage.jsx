import {
  BadgeCheck,
  CalendarRange,
  CreditCard,
  Heart,
  Moon,
  MoveVertical,
  PiggyBank,
  Receipt,
  Settings,
  Sparkles,
  Sun,
} from "lucide-react";
import MobileLayout from "../components/MobileLayout";
import { useTheme } from "../hooks/use-theme";

const themeOptions = [
  { value: "light", label: "Light", description: "Bright and clean", icon: Sun },
  { value: "dark", label: "Dark", description: "Easy on your eyes", icon: Moon },
];

const tutorialSteps = [
  {
    icon: CalendarRange,
    title: "1. Start Salary Cycle",
    text: "Open Cycles tab, add your salary date and salary amount. This becomes the active cycle for your current spending.",
  },
  {
    icon: PiggyBank,
    title: "2. Add Fixed Spending",
    text: "Open Fixed tab and add commitments such as loan, house, school, saving, or family expenses.",
  },
  {
    icon: BadgeCheck,
    title: "3. Mark Paid Items",
    text: "Tick the paid checkbox after payment is completed. Paid item will turn green and show the Paid badge.",
  },
  {
    icon: MoveVertical,
    title: "4. Arrange Fixed Cards",
    text: "Tap Arrange, then use the up and down buttons to move cards. Tap Done when finished.",
  },
  {
    icon: Receipt,
    title: "5. Add Daily Expenses",
    text: "Open Expenses tab to record daily spending. This helps calculate your total spend and remaining balance.",
  },
  {
    icon: CreditCard,
    title: "6. Check Dashboard",
    text: "Open Dashboard to view salary remaining, daily expenses, fixed spending, total spend, and days progress.",
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <MobileLayout>
      <div className="space-y-5 pb-4 mobile-no-select">
        <div className="rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-5 shadow-sm dark:border-white/10 dark:via-card dark:to-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                Preferences
              </p>
              <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Customize how the Salary Tracker app looks.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sun className="h-4 w-4 text-primary" />
            Appearance
          </h2>
          <div className="rounded-[24px] border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold leading-tight">Theme</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Choose the look that feels right for you. Your choice is saved automatically.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5" role="group" aria-label="Choose app theme">
              {themeOptions.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={`flex min-h-[88px] flex-col items-start justify-center gap-1 rounded-2xl border px-3 py-3 text-left transition-colors ${
                    theme === value
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_18px_rgba(34,197,94,0.12)]"
                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span className="text-[10px] font-medium opacity-75">{description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Tutorial
          </h2>

          <div className="space-y-2.5">
            {tutorialSteps.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-tight">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-rose-200/60 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4 shadow-sm dark:border-rose-500/25 dark:from-rose-950/35 dark:via-card dark:to-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-rose-500 shadow-sm dark:bg-rose-500/10">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                Credit
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Created by Nazif Jaafar</h3>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
