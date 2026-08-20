import { Heart, Moon, Settings, Sun } from "lucide-react";
import MobileLayout from "../components/MobileLayout";
import { useTheme } from "../hooks/use-theme";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <MobileLayout>
      <div className="space-y-5 pb-4 mobile-no-select">
        <div className="rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-5 shadow-sm">
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
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Appearance
          </h2>
          <div className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm">
            <p className="text-sm font-semibold leading-tight">Theme</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Choose between light and dark mode.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors ${
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-rose-200/60 dark:border-rose-800/60 bg-gradient-to-br from-rose-50 dark:from-rose-950 via-orange-50 dark:via-orange-950 to-amber-50 dark:to-amber-950 p-4 shadow-sm dark:border-rose-500/30 dark:from-rose-950/40 dark:via-orange-950/30 dark:to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/80 text-rose-500 shadow-sm dark:bg-white/10">
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
