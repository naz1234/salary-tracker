import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, PiggyBank, CalendarRange, Settings, Menu, WalletCards, X } from "lucide-react";

const tabs = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/expenses", icon: Receipt, label: "Expenses" },
  { path: "/fixed", icon: PiggyBank, label: "Fixed" },
  { path: "/future", icon: WalletCards, label: "Future" },
  { path: "/cycles", icon: CalendarRange, label: "Cycles" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTabActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const activeTab = tabs.find((tab) => isTabActive(tab.path));

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  const goToTab = (path) => {
    setSidebarOpen(false);
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <div
      className="app-mobile-shell fixed inset-0 overflow-hidden bg-background"
      style={{
        height: "100dvh",
        minHeight: "100dvh",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
      }}
    >
      <div
        className="relative mx-auto flex h-[100dvh] max-w-lg flex-col overflow-hidden bg-background"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <header className="mobile-no-select z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#05080c]/95">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mobile-tab-button flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition active:scale-95 dark:border-[#202733] dark:bg-[#090d12]/90 dark:text-slate-200"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeTab?.label || "Salary Tracker"}
            </p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Salary Tracker
            </p>
          </div>
        </header>

        {sidebarOpen && (
          <div className="absolute inset-0 z-[100]">
            <button
              type="button"
              className="absolute inset-0 h-full w-full touch-none bg-slate-950/45 backdrop-blur-[2px] animate-in fade-in-0 duration-200 dark:bg-black/75"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            />

            <aside
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              className="mobile-sidebar absolute inset-y-0 left-0 w-[72vw] min-w-[15rem] max-w-[17rem] overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[18px_0_44px_rgba(15,23,42,0.14)] backdrop-blur-xl animate-in slide-in-from-left duration-300 dark:shadow-[18px_0_48px_rgba(0,0,0,0.58)]"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div
                className="relative border-b border-sidebar-border bg-gradient-to-b from-emerald-50/80 via-white/30 to-transparent px-5 pb-4 pr-14 text-left dark:from-emerald-500/[0.08] dark:via-transparent"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
              >
                <h2 className="text-lg font-extrabold tracking-tight text-sidebar-foreground">
                  Salary Tracker
                </h2>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  Choose a section
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="absolute right-3 flex h-10 w-10 touch-manipulation items-center justify-center rounded-2xl border border-sidebar-border bg-sidebar-accent text-muted-foreground transition active:scale-95"
                  style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5 p-3" aria-label="Main navigation links">
                {tabs.map(({ path, icon: Icon, label }) => {
                  const active = isTabActive(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => goToTab(path)}
                      className={`flex h-12 touch-manipulation items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                        active
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 shadow-sm dark:bg-emerald-500/[0.12] dark:text-emerald-400 dark:ring-emerald-500/30 dark:shadow-none"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#10151c] dark:hover:text-slate-100"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          active
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-[#202733] dark:bg-[#10151c] dark:text-slate-400 dark:shadow-none"
                        }`}
                      >
                        <Icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.5]" : ""}`} />
                      </span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          <div
            className="px-4 pt-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
