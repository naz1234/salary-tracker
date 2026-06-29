import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cloudflare } from "@/api/cloudflareClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Flame,
  HandCoins,
  Home,
  Landmark,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Trash2,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/utils/cycleFilters";
import {
  applyPaidStatusToNote,
  getPaidStatusFromNote,
  normalizeFixedSpendingItems,
  stripPaidStatusFromNote,
} from "@/utils/fixedSpendingPaid";
import { normalizeFixedSpendingCategory } from "@/utils/fixedSpendingCategories";
import MobileLayout from "../components/MobileLayout";
import FixedSpendingForm from "../components/FixedSpendingForm";

const LEGACY_PAID_STORAGE_KEY = "salary-cycle-fixed-spending-paid-v1";
const FIXED_SPENDING_CACHE_KEY = "salary-cycle-fixed-spending-last-good-v2";

const readFixedSpendingCache = (cycleId = null) => {
  try {
    const raw = window.localStorage.getItem(FIXED_SPENDING_CACHE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    if (!snapshot?.cycle || !Array.isArray(snapshot?.items)) return null;
    if (cycleId && String(snapshot.cycle.id) !== String(cycleId)) return null;
    return snapshot;
  } catch {
    return null;
  }
};

const writeFixedSpendingCache = (cycle, items = []) => {
  try {
    if (!cycle) return;
    window.localStorage.setItem(
      FIXED_SPENDING_CACHE_KEY,
      JSON.stringify({
        cycle,
        items,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore private-browser storage limitations.
  }
};

const readLegacyPaidStorage = () => {
  try {
    return JSON.parse(
      window.localStorage.getItem(LEGACY_PAID_STORAGE_KEY) || "{}",
    );
  } catch {
    return {};
  }
};

const removeLegacyPaidStorage = () => {
  try {
    window.localStorage.removeItem(LEGACY_PAID_STORAGE_KEY);
  } catch {
    // Ignore private-browser storage limitations.
  }
};

const normalizeSortOrder = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value) =>
  `⃁ ${toAmount(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


const CATEGORY_VISUALS = {
  Rent: {
    Icon: Home,
    card: "border-blue-100 bg-gradient-to-r from-blue-50/95 via-white to-white",
    wrap: "bg-blue-100/80",
    icon: "text-blue-600",
    pill: "bg-blue-100/80 text-blue-700",
    amount: "text-blue-700",
  },
  Loan: {
    Icon: Building2,
    card: "border-sky-100 bg-gradient-to-r from-sky-50/95 via-white to-white",
    wrap: "bg-sky-100/80",
    icon: "text-sky-600",
    pill: "bg-sky-100/80 text-sky-700",
    amount: "text-sky-700",
  },
  Hutang: {
    Icon: HandCoins,
    card: "border-amber-100 bg-gradient-to-r from-amber-50/95 via-white to-white",
    wrap: "bg-amber-100/80",
    icon: "text-amber-600",
    pill: "bg-amber-100/80 text-amber-700",
    amount: "text-amber-700",
  },
  "Pika & (mak abah)": {
    Icon: HandCoins,
    card: "border-pink-100 bg-gradient-to-r from-pink-50/95 via-white to-white",
    wrap: "bg-pink-100/80",
    icon: "text-pink-600",
    pill: "bg-pink-100/80 text-pink-700",
    amount: "text-pink-700",
  },
  Anak: {
    Icon: HandCoins,
    card: "border-purple-100 bg-gradient-to-r from-purple-50/95 via-white to-white",
    wrap: "bg-purple-100/80",
    icon: "text-purple-600",
    pill: "bg-purple-100/80 text-purple-700",
    amount: "text-purple-700",
  },
  "Loan ASB (Saving)": {
    Icon: Landmark,
    card: "border-yellow-100 bg-gradient-to-r from-yellow-50/95 via-white to-white",
    wrap: "bg-yellow-100/80",
    icon: "text-yellow-600",
    pill: "bg-yellow-100/80 text-yellow-700",
    amount: "text-yellow-700",
  },
  "Loan Rumah": {
    Icon: Home,
    card: "border-indigo-100 bg-gradient-to-r from-indigo-50/95 via-white to-white",
    wrap: "bg-indigo-100/80",
    icon: "text-indigo-600",
    pill: "bg-indigo-100/80 text-indigo-700",
    amount: "text-indigo-700",
  },
  Internet: {
    Icon: Wifi,
    card: "border-violet-100 bg-gradient-to-r from-violet-50/95 via-white to-white",
    wrap: "bg-violet-100/80",
    icon: "text-violet-600",
    pill: "bg-violet-100/80 text-violet-700",
    amount: "text-violet-700",
  },
  Insurance: {
    Icon: ShieldCheck,
    card: "border-emerald-100 bg-gradient-to-r from-emerald-50/95 via-white to-white",
    wrap: "bg-emerald-100/80",
    icon: "text-emerald-600",
    pill: "bg-emerald-100/80 text-emerald-700",
    amount: "text-emerald-700",
  },
  Utilities: {
    Icon: Zap,
    card: "border-orange-100 bg-gradient-to-r from-orange-50/95 via-white to-white",
    wrap: "bg-orange-100/80",
    icon: "text-orange-600",
    pill: "bg-orange-100/80 text-orange-700",
    amount: "text-orange-700",
  },
  Subscription: {
    Icon: Repeat,
    card: "border-fuchsia-100 bg-gradient-to-r from-fuchsia-50/95 via-white to-white",
    wrap: "bg-fuchsia-100/80",
    icon: "text-fuchsia-600",
    pill: "bg-fuchsia-100/80 text-fuchsia-700",
    amount: "text-fuchsia-700",
  },
  Other: {
    Icon: Wallet,
    card: "border-slate-100 bg-gradient-to-r from-slate-50/95 via-white to-white",
    wrap: "bg-slate-100/80",
    icon: "text-slate-600",
    pill: "bg-slate-100/80 text-slate-700",
    amount: "text-slate-700",
  },
};

const getCategoryVisual = (item = {}) => {
  const normalizedCategory = normalizeFixedSpendingCategory(item.category);
  if (CATEGORY_VISUALS[normalizedCategory]) {
    return CATEGORY_VISUALS[normalizedCategory];
  }

  const category = String(item.category || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  const text = `${category} ${name}`;

  if (
    text.includes("internet") ||
    text.includes("wifi") ||
    text.includes("wi-fi")
  ) {
    return CATEGORY_VISUALS.Internet;
  }
  if (
    text.includes("electric") ||
    text.includes("utility") ||
    text.includes("utilities")
  ) {
    return CATEGORY_VISUALS.Utilities;
  }
  if (
    text.includes("rent") ||
    text.includes("rumah") ||
    text.includes("housing") ||
    text.includes("apartment")
  ) {
    return text.includes("loan") ? CATEGORY_VISUALS["Loan Rumah"] : CATEGORY_VISUALS.Rent;
  }
  if (text.includes("insurance") || text.includes("insurans")) {
    return CATEGORY_VISUALS.Insurance;
  }
  if (
    text.includes("phone") ||
    text.includes("mobile") ||
    text.includes("call") ||
    text.includes("stc")
  ) {
    return {
      Icon: Phone,
      card: "border-rose-100 bg-gradient-to-r from-rose-50/95 via-white to-white",
      wrap: "bg-rose-100/80",
      icon: "text-rose-600",
      pill: "bg-rose-100/80 text-rose-700",
      amount: "text-rose-700",
    };
  }
  if (
    text.includes("hutang") ||
    text.includes("loan") ||
    text.includes("asb") ||
    text.includes("cimb") ||
    text.includes("rhb")
  ) {
    return text.includes("asb")
      ? CATEGORY_VISUALS["Loan ASB (Saving)"]
      : CATEGORY_VISUALS.Loan;
  }
  if (
    text.includes("anak") ||
    text.includes("family") ||
    text.includes("nafkah") ||
    text.includes("mak") ||
    text.includes("abah")
  ) {
    return text.includes("anak")
      ? CATEGORY_VISUALS.Anak
      : CATEGORY_VISUALS["Pika & (mak abah)"];
  }
  if (
    text.includes("fire") ||
    text.includes("leased") ||
    text.includes("furnish")
  ) {
    return {
      Icon: Flame,
      card: "border-red-100 bg-gradient-to-r from-red-50/95 via-white to-white",
      wrap: "bg-red-100/80",
      icon: "text-red-600",
      pill: "bg-red-100/80 text-red-700",
      amount: "text-red-700",
    };
  }
  if (text.includes("saving") || text.includes("deposit")) {
    return CATEGORY_VISUALS["Loan ASB (Saving)"];
  }

  return CATEGORY_VISUALS.Other;
};

const prepareFixedSpendingItems = (fixedItems = []) => {
  const normalizedItems = normalizeFixedSpendingItems(fixedItems)
    .filter((item) => !item.is_skipped)
    .map((item, index) => ({
      ...item,
      sort_order: normalizeSortOrder(item.sort_order, index),
      category: normalizeFixedSpendingCategory(item.category),
    }));

  // Legacy rows all have sort_order 0. Keep newest-first until the user manually sorts.
  // Once the user drags, sort_order becomes 0,1,2... and this page will always reload by that saved order.
  const uniqueSavedOrders = new Set(
    normalizedItems.map((item) => normalizeSortOrder(item.sort_order)),
  );
  const hasSavedCustomOrder =
    normalizedItems.length > 1 && uniqueSavedOrders.size > 1;

  return [...normalizedItems].sort((a, b) => {
    if (hasSavedCustomOrder) {
      const orderDiff =
        normalizeSortOrder(a.sort_order) - normalizeSortOrder(b.sort_order);
      if (orderDiff !== 0) return orderDiff;
    }

    return (
      new Date(b.created_date || 0).getTime() -
      new Date(a.created_date || 0).getTime()
    );
  });
};

const migrateLegacyPaidStorage = async (fixedItems = []) => {
  const paidMap = readLegacyPaidStorage();
  const paidIds = Object.keys(paidMap);

  if (paidIds.length === 0) return fixedItems;

  const migratedItems = fixedItems.map((item) => {
    if (!Object.prototype.hasOwnProperty.call(paidMap, item.id)) return item;
    const nextPaid = !!paidMap[item.id];
    return {
      ...item,
      is_paid: nextPaid,
      note: applyPaidStatusToNote(item.note, nextPaid),
    };
  });

  const updates = migratedItems
    .filter((item) => Object.prototype.hasOwnProperty.call(paidMap, item.id))
    .map((item) =>
      cloudflare.entities.FixedSpending.update(item.id, {
        is_paid: !!item.is_paid,
        note: item.note,
      }),
    );

  try {
    await Promise.all(updates);
    removeLegacyPaidStorage();
  } catch (error) {
    console.error(
      "Failed to migrate saved paid ticks from browser storage to the cloud database",
      error,
    );
  }

  return migratedItems;
};

const syncMissingPaidMarkers = async (fixedItems = []) => {
  const itemsMissingMarker = fixedItems.filter(
    (item) =>
      getPaidStatusFromNote(item.note) === null && item.is_paid === true,
  );
  if (itemsMissingMarker.length === 0) return;

  try {
    await Promise.all(
      itemsMissingMarker.map((item) =>
        cloudflare.entities.FixedSpending.update(item.id, {
          is_paid: true,
          note: applyPaidStatusToNote(item.note, true),
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to sync paid status marker", error);
  }
};

export default function FixedSpending() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);
  const [availableCycles, setAvailableCycles] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadWarning, setLoadWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPaidIds, setSavingPaidIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [arrangeMode, setArrangeMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const selectedCycleId = params.get("cycleId");

  useEffect(() => {
    load();
  }, [selectedCycleId]);

  useEffect(() => {
    if (params.get("add") === "1" && cycle) {
      setSheetOpen(true);
      window.history.replaceState(
        {},
        "",
        selectedCycleId ? `/fixed?cycleId=${selectedCycleId}` : "/fixed",
      );
    }
  }, [cycle, selectedCycleId]);

  const loadFixedSpendingItems = async (salaryCycleId) => {
    try {
      return await cloudflare.entities.FixedSpending.filter(
        { salary_cycle_id: salaryCycleId },
        "sort_order",
      );
    } catch (error) {
      // Fallback for an older Cloudflare deployment while the new sort_order migration is being applied.
      console.warn(
        "Could not load fixed spending by saved order. Falling back to created date.",
        error,
      );
      return cloudflare.entities.FixedSpending.filter(
        { salary_cycle_id: salaryCycleId },
        "-created_date",
      );
    }
  };

  const load = async () => {
    const cachedSnapshot = readFixedSpendingCache(selectedCycleId);
    const hasCachedSnapshot = !!cachedSnapshot?.cycle;

    setLoading(!hasCachedSnapshot);
    setLoadError("");
    setLoadWarning("");

    if (hasCachedSnapshot) {
      setCycle(cachedSnapshot.cycle);
      setItems(prepareFixedSpendingItems(cachedSnapshot.items));
    }

    try {
      const cycles = await cloudflare.entities.SalaryCycle.list("-start_date", 100);
      setAvailableCycles(cycles);

      let selectedCycle = null;

      if (selectedCycleId) {
        selectedCycle =
          cycles.find((salaryCycle) =>
            String(salaryCycle.id) === String(selectedCycleId),
          ) ||
          (await cloudflare.entities.SalaryCycle.get(selectedCycleId));
      } else {
        selectedCycle =
          cycles.find((salaryCycle) => salaryCycle.status === "active") ||
          cycles[0] ||
          null;
      }

      if (selectedCycle) {
        setCycle(selectedCycle);
        const fixedItems = await loadFixedSpendingItems(selectedCycle.id);
        const preparedItems = prepareFixedSpendingItems(fixedItems);
        setItems(preparedItems);
        writeFixedSpendingCache(selectedCycle, fixedItems);

        // Do legacy cleanup in the background so the page does not stay stuck on the loader.
        migrateLegacyPaidStorage(fixedItems)
          .then(async (migratedFixedItems) => {
            await syncMissingPaidMarkers(migratedFixedItems);
            setItems(prepareFixedSpendingItems(migratedFixedItems));
            writeFixedSpendingCache(selectedCycle, migratedFixedItems);
          })
          .catch((error) => {
            console.error("Fixed spending background sync failed", error);
          });
      } else {
        setCycle(null);
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to load fixed spending", error);
      if (hasCachedSnapshot) {
        setLoadWarning(
          "Showing saved data. Cloudflare is slow right now, but you can tap Retry to refresh.",
        );
      } else {
        setLoadError(
          error?.message ||
            "Fixed Spending could not be loaded. Please try again.",
        );
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    if (editing) {
      await cloudflare.entities.FixedSpending.update(editing.id, {
        ...data,
        category: normalizeFixedSpendingCategory(data.category),
        sort_order: normalizeSortOrder(editing.sort_order),
        is_paid: !!editing.is_paid,
        is_skipped: false,
        note: applyPaidStatusToNote(data.note, !!editing.is_paid),
      });
    } else {
      await cloudflare.entities.FixedSpending.create({
        ...data,
        category: normalizeFixedSpendingCategory(data.category),
        salary_cycle_id: cycle.id,
        sort_order: items.length,
        is_paid: false,
        is_skipped: false,
        note: applyPaidStatusToNote(data.note, false),
      });
    }
    setSheetOpen(false);
    setEditing(null);
    setSaving(false);
    await load();
  };

  const handleDelete = async () => {
    const item = items.find((fixedItem) => fixedItem.id === deleteId);
    if (!item || deleting) {
      setDeleteId(null);
      return;
    }

    setDeleting(true);
    try {
      let nextCachedItems;

      if (item.repeat_every_cycle) {
        // A repeated commitment is only skipped in this salary cycle.
        // The hidden row remains as the recurrence source so it returns next cycle.
        await cloudflare.entities.FixedSpending.update(item.id, {
          is_skipped: true,
          is_paid: false,
          note: applyPaidStatusToNote(item.note, false),
        });
        nextCachedItems = items.map((fixedItem) =>
          fixedItem.id === item.id
            ? { ...fixedItem, is_skipped: true, is_paid: false }
            : fixedItem,
        );
      } else {
        await cloudflare.entities.FixedSpending.delete(item.id);
        nextCachedItems = items.filter((fixedItem) => fixedItem.id !== item.id);
      }

      setItems(prepareFixedSpendingItems(nextCachedItems));
      writeFixedSpendingCache(cycle, nextCachedItems);
      setDeleteId(null);
      await load();
    } catch (error) {
      console.error("Failed to remove fixed spending", error);
      alert(
        "Fixed spending could not be removed. Please check your connection and try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const togglePaid = async (item) => {
    if (arrangeMode || savingOrder) return;

    const nextPaid = !item.is_paid;

    // Save the tick to the cloud database, not localStorage, so it remains visible after refresh
    // and also when opening the same app from incognito or another browser.
    setSavingPaidIds((prev) => [...prev, item.id]);
    setItems((prev) =>
      prev.map((fixedItem) =>
        fixedItem.id === item.id
          ? { ...fixedItem, is_paid: nextPaid }
          : fixedItem,
      ),
    );

    try {
      await cloudflare.entities.FixedSpending.update(item.id, {
        is_paid: nextPaid,
        note: applyPaidStatusToNote(item.note, nextPaid),
      });
    } catch (error) {
      console.error("Failed to save paid status", error);
      setItems((prev) =>
        prev.map((fixedItem) =>
          fixedItem.id === item.id
            ? { ...fixedItem, is_paid: item.is_paid }
            : fixedItem,
        ),
      );
      alert(
        "Paid tick could not be saved. Please check your connection and try again.",
      );
    } finally {
      setSavingPaidIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const toggleArrangeMode = () => {
    if (savingOrder || items.length < 2) return;

    if (arrangeMode) {
      setArrangeMode(false);
      return;
    }

    setStatusFilter("all");
    setArrangeMode(true);
  };

  const moveFixedSpendingItem = async (itemId, direction) => {
    if (savingOrder) return;

    const currentIndex = items.findIndex((item) => item.id === itemId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length)
      return;

    const previousItems = items;
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(currentIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);

    const orderedItems = nextItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setItems(orderedItems);
    writeFixedSpendingCache(cycle, orderedItems);
    setSavingOrder(true);

    try {
      await cloudflare.entities.FixedSpending.bulkUpdate(
        orderedItems.map((item) => ({
          id: item.id,
          sort_order: item.sort_order,
        })),
      );
    } catch (error) {
      console.error("Failed to save fixed spending order", error);
      setItems(previousItems);
      writeFixedSpendingCache(cycle, previousItems);
      alert(
        "Card order could not be saved. Please check your connection and try again.",
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const openSalaryCycle = (salaryCycleId) => {
    if (!salaryCycleId || String(salaryCycleId) === String(cycle?.id)) return;

    setStatusFilter("all");
    setArrangeMode(false);
    navigate(`/fixed?cycleId=${encodeURIComponent(salaryCycleId)}`);
  };

  const total = items.reduce((s, i) => s + toAmount(i.amount), 0);
  const paidItems = items.filter((i) => i.is_paid);
  const dueItems = items.filter((i) => !i.is_paid);
  const paidTotal = paidItems.reduce((s, i) => s + toAmount(i.amount), 0);
  const dueTotal = total - paidTotal;
  const filteredItems =
    statusFilter === "paid"
      ? paidItems
      : statusFilter === "due"
        ? dueItems
        : items;
  const visibleItems = arrangeMode ? items : filteredItems;
  const deleteItem = items.find((item) => item.id === deleteId);

  const filters = [
    { key: "all", label: "All", count: items.length, dot: "bg-emerald-500" },
    {
      key: "paid",
      label: "Paid",
      count: paidItems.length,
      dot: "bg-emerald-500",
    },
    { key: "due", label: "Due", count: dueItems.length, dot: "bg-orange-500" },
  ];

  return (
    <MobileLayout>
      <div
        className="fixed-spending-no-select -mx-4 -mt-4 min-h-full touch-pan-y bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_45%,#f7f9fb_100%)] px-3 pb-4 pt-4 sm:px-4"
        style={{
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        <div className="space-y-3">
          <header className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950">
              Fixed Spending
            </h1>
            {cycle && (
              <div className="flex shrink-0 items-center gap-1.5">
                {items.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={savingOrder}
                    className={`h-10 rounded-2xl px-3 text-[13px] font-bold shadow-sm ${
                      arrangeMode
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={toggleArrangeMode}
                  >
                    {arrangeMode ? (
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <ArrowUp className="mr-1 h-3.5 w-3.5" />
                    )}
                    {arrangeMode ? "Done" : "Arrange"}
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={arrangeMode || savingOrder}
                  className="h-10 shrink-0 rounded-2xl bg-emerald-500 px-3.5 text-[13px] font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 disabled:bg-slate-300 disabled:shadow-none"
                  onClick={() => {
                    setEditing(null);
                    setSheetOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>
            )}
          </header>

          {availableCycles.length > 0 && (
            <section className="rounded-[1.25rem] bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Salary Cycle</p>
                    <p className="text-[10px] font-medium text-slate-400">Choose which cycle to view</p>
                  </div>
                </div>
                {cycle && (
                  <Badge
                    variant="secondary"
                    className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                      cycle.status === "active"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {cycle.status === "active" ? "Active" : "Closed"}
                  </Badge>
                )}
              </div>
              <Select
                value={cycle?.id ? String(cycle.id) : ""}
                onValueChange={openSalaryCycle}
                disabled={arrangeMode || savingOrder}
              >
                <SelectTrigger className="h-11 rounded-2xl border-emerald-200 bg-emerald-50/60 px-3 text-[12px] font-semibold text-slate-800 shadow-sm focus:ring-emerald-300">
                  <SelectValue placeholder="Select salary cycle" />
                </SelectTrigger>
                <SelectContent>
                  {availableCycles.map((salaryCycle) => (
                    <SelectItem key={salaryCycle.id} value={String(salaryCycle.id)} className="text-[12px]">
                      {formatDisplayDate(salaryCycle.start_date)} — {salaryCycle.end_date ? formatDisplayDate(salaryCycle.end_date) : "Current"}
                      {salaryCycle.status === "active" ? " · Active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          )}

          {cycle && (
            <section className="rounded-[1.5rem] bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 shadow-sm ring-1 ring-emerald-100">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Wallet className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-500">Total Fixed Spending</p>
                  <h2 className="mt-1 text-[1.3rem] font-black tracking-tight text-slate-950">{formatMoney(total)}</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-emerald-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Paid
                  </span>
                  <span className="text-[11px] font-extrabold tabular-nums text-emerald-700">{formatMoney(paidTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-orange-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Clock3 className="h-4 w-4 text-orange-600" /> Due
                  </span>
                  <span className="text-[11px] font-extrabold tabular-nums text-orange-600">{formatMoney(dueTotal)}</span>
                </div>
              </div>
            </section>
          )}

          {!cycle && !loading && !loadError && (
            <p className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              No salary cycle selected. Create one first from the Dashboard or
              open one from Salary Cycles.
            </p>
          )}

          {cycle && (
            <div className="grid grid-cols-3 gap-1.5">
              {filters.map((filter) => {
                const active = statusFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setStatusFilter(filter.key)}
                    disabled={arrangeMode}
                    aria-pressed={active}
                    className={`h-9 rounded-xl border px-1.5 text-[11px] font-medium transition-all disabled:opacity-60 ${
                      active
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-100 bg-white/80 text-slate-500 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      {filter.key !== "all" && (
                        <span className={`h-2 w-2 rounded-full ${filter.dot}`} />
                      )}
                      {filter.label} ({filter.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {arrangeMode && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-[11px] leading-4 text-emerald-800 shadow-sm">
              <span>
                {savingOrder
                  ? "Saving order to D1..."
                  : "Move Mode is ON. Tap ↑ or ↓ to rearrange cards. Order saves to D1."}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-emerald-700"
                onClick={toggleArrangeMode}
                disabled={savingOrder}
              >
                Done
              </button>
            </div>
          )}

          {loadWarning && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-[11px] leading-4 text-amber-800 shadow-sm">
              <span>{loadWarning}</span>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-amber-700"
                onClick={load}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2 py-1">
              {[1, 2, 3, 4].map((key) => (
                <div
                  key={key}
                  className="h-16 animate-pulse rounded-[1rem] border border-slate-100 bg-white/80 shadow-sm"
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="mt-3 text-sm font-bold text-red-800">
                Fixed Spending could not load.
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-red-600">
                {loadError}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 rounded-xl gap-1.5"
                onClick={load}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : items.length === 0 && cycle ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ReceiptText className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No fixed spending yet.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Tap Add to record commitments like rent, loans, utilities, or
                family support.
              </p>
            </div>
          ) : visibleItems.length === 0 && cycle ? (
            <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-6 text-center text-sm text-slate-500 shadow-sm">
              No {statusFilter} fixed spending item found.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleItems.map((i, index) => {
                const isSavingPaid = savingPaidIds.includes(i.id);
                const { Icon, card, wrap, icon, pill, amount } = getCategoryVisual(i);
                const cleanNote = stripPaidStatusFromNote(i.note);

                return (
                  <div
                    key={i.id}
                    data-fixed-spending-id={String(i.id)}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    className={`group relative flex select-none items-center gap-2 rounded-[1.05rem] border px-2.5 py-2 shadow-[0_8px_22px_rgba(15,23,42,0.055)] transition-[box-shadow,border-color,opacity,transform] duration-200 ${card} ${
                      arrangeMode ? "ring-1 ring-emerald-200" : ""
                    } ${i.is_paid ? "saturate-[0.92]" : ""} ${isSavingPaid || savingOrder ? "opacity-70" : ""}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${wrap}`}
                    >
                      <Icon className={`h-4 w-4 ${icon}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5 leading-tight">
                        <p className="truncate text-[13px] font-medium text-slate-900">
                          {i.name}
                        </p>
                      </div>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[11px] font-normal leading-4 text-slate-500">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${pill}`}
                        >
                          {i.category || "Other"}
                        </span>
                        {cleanNote && (
                          <span className="truncate text-slate-500">
                            {cleanNote}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="ml-1 flex w-[90px] shrink-0 flex-col items-end gap-0.5">
                      <p
                        className={`text-right text-[12px] font-medium leading-tight tabular-nums ${amount}`}
                      >
                        {formatMoney(i.amount)}
                      </p>

                      <div className="flex items-center gap-0.5">
                        {arrangeMode ? (
                          <>
                            <button
                              type="button"
                              disabled={savingOrder || index === 0}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:opacity-70"
                              onClick={() => moveFixedSpendingItem(i.id, -1)}
                              aria-label={`Move ${i.name} up`}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                savingOrder || index === visibleItems.length - 1
                              }
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:opacity-70"
                              onClick={() => moveFixedSpendingItem(i.id, 1)}
                              aria-label={`Move ${i.name} down`}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => togglePaid(i)}
                              disabled={isSavingPaid || savingOrder}
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-default disabled:opacity-70 ${
                                i.is_paid
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                              }`}
                              aria-label={
                                i.is_paid
                                  ? `Paid. Mark ${i.name} as due`
                                  : `Due. Mark ${i.name} as paid`
                              }
                              title={i.is_paid ? "Paid" : "Due"}
                            >
                              {i.is_paid ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Clock3 className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50"
                              onClick={() => {
                                setEditing(i);
                                setSheetOpen(true);
                              }}
                              aria-label={`Edit ${i.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50"
                                  aria-label={`More options for ${i.name}`}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-2xl"
                              >
                                <DropdownMenuItem
                                  onClick={() => togglePaid(i)}
                                  disabled={isSavingPaid}
                                  className="gap-2"
                                >
                                  {i.is_paid ? (
                                    <CircleAlert className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  {i.is_paid ? "Mark as Due" : "Mark as Paid"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(i.id)}
                                  className="gap-2 text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {i.repeat_every_cycle ? "Remove This Cycle" : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-[1.75rem] max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {editing ? "Edit Fixed Spending" : "Add Fixed Spending"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-6">
            <FixedSpendingForm
              onSubmit={handleSubmit}
              initial={editing}
              loading={saving}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteItem?.repeat_every_cycle
                ? "Remove for this cycle?"
                : "Delete this item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.repeat_every_cycle
                ? `This item will be removed only from the ${formatDisplayDate(cycle?.start_date)} salary cycle. It will return automatically in the next cycle.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {deleting
                ? "Removing..."
                : deleteItem?.repeat_every_cycle
                  ? "Remove This Cycle"
                  : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
