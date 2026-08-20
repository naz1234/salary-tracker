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
      <div className="relative mx-auto flex h-[100dvh] max-w-lg flex-col overflow-hidden bg-background">
        <header
          className="mobile-no-select z-50 flex shrink-0 items-center gap-2 border-b border-border bg-card/95 px-2 py-2 backdrop-blur-lg"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
        >
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="mobile-tab-button flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b border-border px-4 py-4 text-left">
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {tabs.map(({ path, icon: Icon, label }) => {
                  const active = location.pathname === path;
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => goToTab(path)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      aria-current={active ? "page" : undefined}
                      aria-label={`Open ${label}`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold text-foreground">
            {tabs.find((tab) => tab.path === location.pathname)?.label ?? ""}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          <div className="px-4 pb-6 pt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
