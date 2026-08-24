import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, PiggyBank, CalendarRange, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const tabs = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/expenses", icon: Receipt, label: "Expenses" },
  { path: "/fixed", icon: PiggyBank, label: "Fixed" },
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
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="mobile-tab-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition active:scale-95 dark:border-[#202733] dark:bg-[#090d12]/90 dark:text-slate-200"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="mobile-sidebar w-[78vw] max-w-[18rem] border-r border-slate-200 bg-white/95 p-0 backdrop-blur-xl dark:border-[#202733] dark:bg-[#05080c]/98"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <SheetHeader
                className="border-b border-slate-200 px-5 pb-4 text-left dark:border-[#202733]"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
              >
                <SheetTitle className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
                  Salary Tracker
                </SheetTitle>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Choose a section
                </p>
              </SheetHeader>

              <nav className="flex flex-col gap-1.5 p-3" aria-label="Main navigation">
                {tabs.map(({ path, icon: Icon, label }) => {
                  const active = isTabActive(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => goToTab(path)}
                      className={`flex h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                        active
                          ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-400 dark:ring-emerald-500/25"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-[#10151c] dark:hover:text-slate-100"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          active
                            ? "bg-emerald-500/10"
                            : "bg-slate-100 dark:bg-[#10151c]"
                        }`}
                      >
                        <Icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.5]" : ""}`} />
                      </span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeTab?.label || "Salary Tracker"}
            </p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Salary Tracker
            </p>
          </div>
        </header>

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
