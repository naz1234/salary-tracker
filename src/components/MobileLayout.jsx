import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, PiggyBank, CalendarRange, Settings, WalletCards, X } from "lucide-react";

const EDGE_SWIPE_ZONE_PX = 72;
const IOS_HISTORY_EDGE_PX = 24;
const SWIPE_DISTANCE_PX = 64;
const HORIZONTAL_SWIPE_BIAS = 1.2;
const POST_SWIPE_CLICK_GUARD_MS = 450;

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
  const shellRef = useRef(null);
  const swipeGesture = useRef(null);
  const blockClicksUntil = useRef(0);

  const isTabActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const stopNativeEdgeNavigation = (event) => {
      if (sidebarOpen || event.touches.length !== 1) return;
      if (event.touches[0].clientX <= IOS_HISTORY_EDGE_PX && event.cancelable) {
        event.preventDefault();
      }
    };

    const stopNativeHorizontalNavigation = (event) => {
      const gesture = swipeGesture.current;
      if (!gesture || gesture.mode !== "open" || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const horizontalDistance = touch.clientX - gesture.startX;
      const verticalDistance = Math.abs(touch.clientY - gesture.startY);
      const isOpeningSwipe =
        horizontalDistance > 8 && horizontalDistance > verticalDistance * HORIZONTAL_SWIPE_BIAS;

      if (isOpeningSwipe && event.cancelable) {
        event.preventDefault();
      }
    };

    shell.addEventListener("touchstart", stopNativeEdgeNavigation, { passive: false });
    shell.addEventListener("touchmove", stopNativeHorizontalNavigation, { passive: false });
    return () => {
      shell.removeEventListener("touchstart", stopNativeEdgeNavigation);
      shell.removeEventListener("touchmove", stopNativeHorizontalNavigation);
    };
  }, [sidebarOpen]);

  const goToTab = (path) => {
    setSidebarOpen(false);
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const startOpenSwipe = (event) => {
    if (sidebarOpen || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (touch.clientX > EDGE_SWIPE_ZONE_PX) return;

    swipeGesture.current = {
      mode: "open",
      startX: touch.clientX,
      startY: touch.clientY,
    };
  };

  const startCloseSwipe = (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    swipeGesture.current = {
      mode: "close",
      startX: touch.clientX,
      startY: touch.clientY,
    };
  };

  const finishSwipe = (event) => {
    const gesture = swipeGesture.current;
    swipeGesture.current = null;
    if (!gesture || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const horizontalDistance = touch.clientX - gesture.startX;
    const verticalDistance = Math.abs(touch.clientY - gesture.startY);
    const isMostlyHorizontal = Math.abs(horizontalDistance) > verticalDistance * HORIZONTAL_SWIPE_BIAS;

    if (gesture.mode === "open" && horizontalDistance >= SWIPE_DISTANCE_PX && isMostlyHorizontal) {
      blockClicksUntil.current = Date.now() + POST_SWIPE_CLICK_GUARD_MS;
      if (event.cancelable) event.preventDefault();
      setSidebarOpen(true);
    }

    if (gesture.mode === "close" && horizontalDistance <= -SWIPE_DISTANCE_PX && isMostlyHorizontal) {
      setSidebarOpen(false);
    }
  };

  const cancelSwipe = () => {
    swipeGesture.current = null;
  };

  const blockPostSwipeClick = (event) => {
    if (Date.now() >= blockClicksUntil.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={shellRef}
      className="app-mobile-shell fixed inset-0 overflow-hidden bg-background"
      onClickCapture={blockPostSwipeClick}
      onTouchStart={startOpenSwipe}
      onTouchEnd={finishSwipe}
      onTouchCancel={cancelSwipe}
      style={{
        height: "100dvh",
        minHeight: "100dvh",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        overscrollBehaviorX: "none",
        touchAction: "pan-y pinch-zoom",
      }}
    >
      <div
        className="relative mx-auto flex h-[100dvh] max-w-lg flex-col overflow-hidden bg-background"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="sr-only"
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="mobile-navigation-drawer"
        >
          Open navigation
        </button>

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
              onTouchStart={startCloseSwipe}
              onTouchEnd={finishSwipe}
              onTouchCancel={cancelSwipe}
              className="mobile-sidebar absolute inset-y-0 left-0 flex w-[72vw] min-w-[15rem] max-w-[17rem] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[18px_0_44px_rgba(15,23,42,0.14)] backdrop-blur-xl animate-in slide-in-from-left duration-300 dark:shadow-[18px_0_48px_rgba(0,0,0,0.58)]"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div
                className="relative shrink-0 border-b border-sidebar-border bg-gradient-to-b from-emerald-50/80 via-white/30 to-transparent px-5 pb-4 pr-14 text-left dark:from-emerald-500/[0.08] dark:via-transparent"
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

              <nav
                className="mt-auto flex min-h-0 flex-col gap-1.5 overflow-y-auto p-3 overscroll-contain no-scrollbar"
                aria-label="Main navigation links"
              >
                {tabs.map(({ path, icon: Icon, label }) => {
                  const active = isTabActive(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => goToTab(path)}
                      className={`flex h-12 shrink-0 touch-manipulation items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
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
