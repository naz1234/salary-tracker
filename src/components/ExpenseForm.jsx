import { useRef, useState } from "react";
import { ClipboardPaste, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createExpenseDraft, parseExpensePaste } from "@/utils/pastedExpenseParser";
import { formatDateOnlyFromDate } from "@/utils/cycleFilters";

const categories = ["Food", "Groceries", "Transport", "Kids", "Bills", "Shopping", "Emergency", "Healthcare", "Entertainment", "Hungerstation", "Naim", "OCC order Makan", "Wife Req.", "Wife Req. brg Anak", "Other"];
const paymentMethods = ["Cash", "Card", "Online Transfer", "E-Wallet", "BNPL", "Other"];

function getDefaultExpenseDate(cycle) {
  const today = formatDateOnlyFromDate(new Date());

  if (!cycle?.start_date) return today;
  if (today < cycle.start_date) return cycle.start_date;
  if (cycle.end_date && today > cycle.end_date) return cycle.end_date;

  return today;
}

export default function ExpenseForm({ onSubmit, initial, loading, cycle }) {
  const [form, setForm] = useState({
    date: initial?.date || getDefaultExpenseDate(cycle),
    amount: initial?.amount || "",
    category: initial?.category || "",
    description: initial?.description || "",
    payment_method: initial?.payment_method || "",
  });
  const [smsText, setSmsText] = useState("");
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsStatus, setSmsStatus] = useState(null);
  const [importEntries, setImportEntries] = useState([]);
  const [importIndex, setImportIndex] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [reading, setReading] = useState(false);
  const submitInFlight = useRef(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const minDate = cycle?.start_date || undefined;
  const maxDate = cycle?.end_date || undefined;

  const showParsedEntry = (parsed) => {
    setForm(createExpenseDraft(parsed));
    setSaveError("");

    const outsideCycle = parsed.data.date && (
      (minDate && parsed.data.date < minDate) ||
      (maxDate && parsed.data.date > maxDate)
    );
    const details = [
      parsed.merchant || "transaction",
      parsed.amount ? `${parsed.amount.toFixed(2)} SAR` : null,
      parsed.date || null,
    ].filter(Boolean).join(" · ");

    let message = `Read: ${details}.`;
    if (parsed.sourceCurrency === "MYR") message += " RM amount recorded as SAR, without conversion.";
    if (parsed.relativeDate) message += ` ${parsed.relativeDate} is based on this device's date when pasted; check it before saving.`;
    if (parsed.usedTotalDue) message += " Total due amount was used so card fees are included.";
    if (parsed.missing.length) message += ` Please check ${parsed.missing.join(" and ")} manually.`;
    if (outsideCycle) message += " This date is outside the selected salary cycle.";

    setSmsStatus({ type: outsideCycle || parsed.missing.length ? "warning" : "success", message });
  };

  const applySms = (text) => {
    if (submitInFlight.current) return;
    const parsed = parseExpensePaste(text);
    if (!parsed.ok) {
      setSmsStatus({ type: "error", message: parsed.error });
      setShowSmsInput(true);
      return;
    }
    setImportEntries(parsed.entries);
    setImportIndex(0);
    showParsedEntry(parsed.entries[0]);
  };

  const hasNextEntry = importIndex + 1 < importEntries.length;
  const amount = Number(form.amount);
  const outsideCycle = (minDate && form.date < minDate) || (maxDate && form.date > maxDate);
  const canSave = form.date && Number.isFinite(amount) && amount > 0 && form.category && !outsideCycle;

  const handleSave = async () => {
    if (submitInFlight.current || loading || reading || !canSave) return;
    submitInFlight.current = true;
    setSaveError("");
    try {
      const saved = await onSubmit({ ...form, amount }, { keepOpen: hasNextEntry });
      if (saved === false) return;
      if (hasNextEntry) {
        const nextIndex = importIndex + 1;
        setImportIndex(nextIndex);
        showParsedEntry(importEntries[nextIndex]);
      }
    } catch (error) {
      setSaveError(error.message || "Could not save. Your entry is still here; check your connection and try again.");
    } finally {
      submitInFlight.current = false;
    }
  };

  const handlePasteAndRead = async () => {
    if (loading || reading || submitInFlight.current) return;
    setSmsStatus(null);

    if (!navigator.clipboard?.readText) {
      setShowSmsInput(true);
      setSmsStatus({
        type: "warning",
        message: "Clipboard access is not available here. Paste in the box below, then tap Read transactions.",
      });
      return;
    }

    setReading(true);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setShowSmsInput(true);
        setSmsStatus({ type: "warning", message: "Your clipboard is empty. Copy the transactions first." });
        return;
      }

      setSmsText(text);
      applySms(text);
    } catch {
      setShowSmsInput(true);
      setSmsStatus({
        type: "warning",
        message: "Clipboard permission was blocked. Paste in the box below, then tap Read transactions.",
      });
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      {!initial && (
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <MessageSquareText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Import transactions</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Paste bank SMS, BNPL purchases or bank-app transactions. Review each expense before saving.
              </p>
            </div>
          </div>

          <div className="mt-3 flex min-w-0 gap-2">
            <Button type="button" disabled={loading || reading} className="pika-action h-10 min-w-0 flex-1 rounded-xl text-xs font-semibold text-white" onClick={handlePasteAndRead}>
              <ClipboardPaste className="mr-1.5 h-4 w-4" /> Paste & Read
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-3 text-xs font-semibold"
              onClick={() => setShowSmsInput((current) => !current)}
            >
              {showSmsInput ? "Hide" : "Manual"}
            </Button>
          </div>

          {showSmsInput && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={smsText}
                onChange={(event) => setSmsText(event.target.value)}
                placeholder="Paste bank SMS or transactions here..."
                wrap="soft"
                className="min-h-32 max-w-full resize-none overflow-x-hidden whitespace-pre-wrap break-words bg-card text-base dark:bg-background"
              />
              <Button type="button" variant="outline" className="h-10 w-full rounded-xl text-xs font-semibold" disabled={!smsText.trim() || loading || reading} onClick={() => applySms(smsText)}>
                Read transactions
              </Button>
            </div>
          )}

          {smsStatus && (
            <p
              aria-live="polite"
              className={`mt-2 max-w-full break-words rounded-xl px-3 py-2 text-xs leading-5 ${
                smsStatus.type === "error"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  : smsStatus.type === "warning"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}
            >
              {smsStatus.message}
            </p>
          )}
          {importEntries.length > 1 && (
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <p aria-live="polite" className="font-semibold">Review {importIndex + 1} of {importEntries.length}</p>
              {hasNextEntry && (
                <Button type="button" variant="outline" disabled={loading || reading} className="rounded-xl" onClick={() => {
                  if (submitInFlight.current) return;
                  const nextIndex = importIndex + 1;
                  setImportIndex(nextIndex);
                  showParsedEntry(importEntries[nextIndex]);
                }}>Skip this entry</Button>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <Label>Date</Label>
        <Input type="date" value={form.date} min={minDate} max={maxDate} onChange={(e) => set("date", e.target.value)} className="mt-1 h-12 text-base" />
        {!form.date && <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Choose a date before saving.</p>}
        {form.date && outsideCycle && <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Choose a date within the selected salary cycle, or open the matching cycle.</p>}
        {cycle?.start_date && (
          <p className="mt-1 text-xs text-muted-foreground">
            This expense will be saved under {cycle.start_date}{cycle.end_date ? ` to ${cycle.end_date}` : " onwards"} salary cycle.
          </p>
        )}
      </div>
      <div>
        <Label>Amount (⃁)</Label>
        <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="mt-1 h-12 text-base" />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => set("category", v)}>
          <SelectTrigger className="mt-1 h-12 text-base"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea placeholder="What was this for?" value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1 text-base" />
      </div>
      <div>
        <Label>Payment Method (optional)</Label>
        <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v)}>
          <SelectTrigger className="mt-1 h-12 text-base"><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>{paymentMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {saveError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{saveError}</p>}
      <Button
        className="pika-action w-full h-12 text-base font-semibold text-white rounded-xl"
        disabled={!canSave || loading || reading}
        onClick={handleSave}
      >
        {loading ? "Saving..." : initial ? "Update Expense" : hasNextEntry ? "Add Expense & Next" : "Add Expense"}
      </Button>
    </div>
  );
}
