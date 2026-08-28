import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  BriefcaseBusiness,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  Scale,
  Trash2,
  WalletCards,
} from "lucide-react";
import MobileLayout from "../components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "salary-cycle-future-expense-plan-v1";

const emptyPlan = {
  expectedSalary: "",
  savingsSources: [],
  commitments: [],
};

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `future-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadSavingsSources(stored) {
  if (Array.isArray(stored.savingsSources)) {
    return stored.savingsSources
      .filter((item) => item && item.source && Number(item.amount) > 0)
      .map((item) => ({
        id: String(item.id || makeId()),
        source: String(item.source),
        amount: Number(item.amount),
      }));
  }

  const legacySavings = Number(stored.savings);
  return Number.isFinite(legacySavings) && legacySavings > 0
    ? [{ id: makeId(), source: "Previous savings", amount: legacySavings }]
    : [];
}

function loadPlan() {
  if (typeof window === "undefined") return emptyPlan;

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return emptyPlan;

    return {
      expectedSalary:
        stored.expectedSalary === "" || Number.isFinite(Number(stored.expectedSalary))
          ? String(stored.expectedSalary ?? "")
          : "",
      savingsSources: loadSavingsSources(stored),
      commitments: Array.isArray(stored.commitments)
        ? stored.commitments
            .filter((item) => item && item.name && Number(item.amount) > 0)
            .map((item) => ({
              id: String(item.id || makeId()),
              name: String(item.name),
              amount: Number(item.amount),
              remainingLoan: Math.max(0, Number(item.remainingLoan) || 0),
            }))
        : [],
    };
  } catch {
    return emptyPlan;
  }
}

function formatCurrency(value) {
  return `RM ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function AllocationRing({ percentage, overBudget }) {
  const ringValue = clampPercentage(percentage);

  return (
    <div
      className="relative h-[4.4rem] w-[4.4rem] shrink-0"
      aria-label={`${Math.round(percentage)}% of expected salary allocated`}
    >
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
        <span
          className={`text-[0.86rem] font-extrabold tabular-nums ${
            overBudget ? "text-destructive" : "text-foreground"
          }`}
        >
          {Math.round(percentage)}%
        </span>
        <span className="mt-0.5 text-[0.58rem] font-semibold text-muted-foreground">allocated</span>
      </div>
    </div>
  );
}

export default function FutureExpenses() {
  const [plan, setPlan] = useState(loadPlan);
  const [savingsForm, setSavingsForm] = useState({ source: "", amount: "" });
  const [editingSavingsId, setEditingSavingsId] = useState(null);
  const [savingsFormError, setSavingsFormError] = useState("");
  const [form, setForm] = useState({ name: "", amount: "", remainingLoan: "" });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const expectedSalary = Math.max(0, Number(plan.expectedSalary) || 0);
  const savings = useMemo(
    () => plan.savingsSources.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [plan.savingsSources],
  );
  const totalCommitments = useMemo(
    () => plan.commitments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [plan.commitments],
  );
  const totalLoanBalance = useMemo(
    () => plan.commitments.reduce((sum, item) => sum + Number(item.remainingLoan || 0), 0),
    [plan.commitments],
  );
  const remaining = expectedSalary - totalCommitments;
  const overBudget = remaining < 0;
  const netPosition = savings - totalLoanBalance;
  const hasNetDeficit = netPosition < 0;
  const allocationPercentage = expectedSalary > 0 ? (totalCommitments / expectedSalary) * 100 : 0;
  const remainingPercentage = expectedSalary > 0 ? (remaining / expectedSalary) * 100 : 0;
  const remainingBar = clampPercentage(remainingPercentage);

  const updatePlanAmount = (field, value) => {
    if (value !== "" && Number(value) < 0) return;
    setPlan((current) => ({ ...current, [field]: value }));
  };

  const resetSavingsForm = () => {
    setSavingsForm({ source: "", amount: "" });
    setEditingSavingsId(null);
    setSavingsFormError("");
  };

  const saveSavingsSource = (event) => {
    event.preventDefault();
    const source = savingsForm.source.trim();
    const amount = Number(savingsForm.amount);

    if (!source || !Number.isFinite(amount) || amount <= 0) {
      setSavingsFormError("Enter a savings source and an amount above zero.");
      return;
    }

    setPlan((current) => ({
      ...current,
      savingsSources: editingSavingsId
        ? current.savingsSources.map((item) =>
            item.id === editingSavingsId ? { ...item, source, amount } : item,
          )
        : [...current.savingsSources, { id: makeId(), source, amount }],
    }));
    resetSavingsForm();
  };

  const editSavingsSource = (item) => {
    setEditingSavingsId(item.id);
    setSavingsForm({ source: item.source, amount: String(item.amount) });
    setSavingsFormError("");
  };

  const deleteSavingsSource = (id) => {
    setPlan((current) => ({
      ...current,
      savingsSources: current.savingsSources.filter((item) => item.id !== id),
    }));
    if (editingSavingsId === id) resetSavingsForm();
  };

  const resetForm = () => {
    setForm({ name: "", amount: "", remainingLoan: "" });
    setEditingId(null);
    setFormError("");
  };

  const saveCommitment = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const amount = Number(form.amount);
    const remainingLoan = form.remainingLoan === "" ? 0 : Number(form.remainingLoan);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a commitment name and a monthly payment above zero.");
      return;
    }

    if (!Number.isFinite(remainingLoan) || remainingLoan < 0) {
      setFormError("Remaining loan balance must be zero or more.");
      return;
    }

    setPlan((current) => ({
      ...current,
      commitments: editingId
        ? current.commitments.map((item) =>
            item.id === editingId ? { ...item, name, amount, remainingLoan } : item,
          )
        : [...current.commitments, { id: makeId(), name, amount, remainingLoan }],
    }));
    resetForm();
  };

  const editCommitment = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      amount: String(item.amount),
      remainingLoan: item.remainingLoan > 0 ? String(item.remainingLoan) : "",
    });
    setFormError("");
  };

  const deleteCommitment = (id) => {
    setPlan((current) => ({
      ...current,
      commitments: current.commitments.filter((item) => item.id !== id),
    }));
    if (editingId === id) resetForm();
  };

  return (
    <MobileLayout>
      <div className="space-y-4 pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Future Expenses
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Plan your next salary before it arrives.
          </p>
        </div>

        <div className="space-y-3">
          <section className="pika-card pika-cycle-card overflow-hidden rounded-[1.35rem] border border-primary/[0.09] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/[0.12] text-primary ring-1 ring-inset ring-primary/[0.08]">
                <WalletCards className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.1} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.8rem] font-bold text-foreground">Future Plan</h2>
                <p className="mt-0.5 truncate text-[0.66rem] font-semibold text-muted-foreground">
                  Expected next salary
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/[0.11] px-2.5 py-1 text-[0.66rem] font-bold text-primary ring-1 ring-inset ring-primary/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {plan.commitments.length} {plan.commitments.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="pika-money-panel mt-3 grid grid-cols-[1fr_1px_1fr] items-stretch gap-3 rounded-[1rem] border px-3 py-3">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold text-muted-foreground">Expected salary</p>
                <p className="mt-2 whitespace-nowrap text-[clamp(0.92rem,4vw,1.3rem)] font-extrabold leading-none tracking-tight tabular-nums text-foreground">
                  {formatCurrency(expectedSalary)}
                </p>
              </div>

              <div className="h-full min-h-[3.9rem] bg-muted/60" />

              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold text-muted-foreground">
                  {overBudget ? "Shortfall" : "Remaining"}
                </p>
                <p
                  className={`mt-2 whitespace-nowrap text-[clamp(0.9rem,3.8vw,1.2rem)] font-extrabold leading-none tracking-tight tabular-nums ${
                    overBudget ? "text-destructive" : "text-primary"
                  }`}
                >
                  {formatCurrency(Math.abs(remaining))}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/55">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        overBudget
                          ? "bg-rose-400"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-300"
                      }`}
                      style={{ width: `${overBudget ? 100 : remainingBar}%` }}
                    />
                  </div>
                  <span
                    className={`text-[0.64rem] font-bold tabular-nums ${
                      overBudget ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {overBudget ? "Over" : `${Math.round(remainingBar)}%`}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="pika-card rounded-[1.35rem] border border-border/70 p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-accent text-brand-pink ring-1 ring-inset ring-brand-pink/10">
                <ArrowDownRight className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.82rem] font-bold text-foreground">Monthly Commitments</h2>
                <p className="mt-2 truncate text-[clamp(1.15rem,5.5vw,1.55rem)] font-extrabold leading-none tracking-tight tabular-nums text-foreground">
                  {formatCurrency(totalCommitments)}
                </p>
              </div>
              <AllocationRing percentage={allocationPercentage} overBudget={overBudget} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="pika-breakdown flex min-w-0 items-center gap-2 rounded-[1rem] border border-border/70 px-2.5 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-primary/[0.11] text-primary ring-1 ring-inset ring-primary/[0.08]">
                  <PiggyBank className="h-[0.95rem] w-[0.95rem]" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.64rem] font-semibold text-muted-foreground">
                    Current Savings
                  </span>
                  <span className="mt-0.5 block truncate text-[clamp(0.66rem,2.7vw,0.82rem)] font-bold tabular-nums text-foreground">
                    {formatCurrency(savings)}
                  </span>
                  <span className="mt-0.5 block text-[0.56rem] font-semibold text-muted-foreground">
                    {plan.savingsSources.length} {plan.savingsSources.length === 1 ? "source" : "sources"}
                  </span>
                </span>
              </div>

              <div className="pika-breakdown flex min-w-0 items-center gap-2 rounded-[1rem] border border-border/70 px-2.5 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-primary/[0.11] text-primary ring-1 ring-inset ring-primary/[0.08]">
                  <Landmark className="h-[0.95rem] w-[0.95rem]" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.64rem] font-semibold text-muted-foreground">
                    Loan Balances
                  </span>
                  <span className="mt-0.5 block truncate text-[clamp(0.66rem,2.7vw,0.82rem)] font-bold tabular-nums text-foreground">
                    {formatCurrency(totalLoanBalance)}
                  </span>
                </span>
              </div>
            </div>

            <div
              className={`mt-2 flex items-center justify-between gap-3 rounded-[1rem] border bg-background/70 px-2.5 py-2.5 ${
                hasNetDeficit ? "border-rose-400/[0.13]" : "border-border/70"
              }`}
            >
              <div
                className={`flex min-w-0 items-center gap-2 ${
                  hasNetDeficit ? "text-destructive" : "text-primary"
                }`}
              >
                <Scale className="h-[0.95rem] w-[0.95rem] shrink-0" strokeWidth={2.2} />
                <span className="truncate text-[0.64rem] font-semibold">
                  {hasNetDeficit ? "Loans above savings" : "Savings after loans"}
                </span>
              </div>
              <span
                className={`shrink-0 text-[0.82rem] font-extrabold tabular-nums ${
                  hasNetDeficit ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatCurrency(Math.abs(netPosition))}
              </span>
            </div>
          </section>
        </div>

        <section className="pika-card pika-cycle-card relative overflow-hidden rounded-[1.4rem] border border-primary/[0.1] p-3.5">
          <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-primary/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/[0.11] text-primary ring-1 ring-inset ring-primary/[0.08]">
              <BriefcaseBusiness className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.88rem] font-extrabold text-foreground">Next-job salary</h2>
              <p className="mt-0.5 truncate text-[0.68rem] font-medium text-muted-foreground">
                Set the take-home amount for your next plan.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/[0.09] px-2.5 py-1 text-[0.62rem] font-bold text-primary ring-1 ring-inset ring-primary/[0.08]">
              Auto-saved
            </span>
          </div>

          <div className="pika-input-panel relative mt-3 flex items-center gap-2.5 rounded-[1rem] border border-input bg-card px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-muted/60 text-[0.85rem] font-extrabold text-primary ring-1 ring-inset ring-border/70">
              RM
            </span>
            <div className="min-w-0 flex-1">
              <Label htmlFor="future-salary" className="text-[0.62rem] font-semibold text-muted-foreground">
                Expected take-home
              </Label>
              <Input
                id="future-salary"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={plan.expectedSalary}
                onChange={(event) => updatePlanAmount("expectedSalary", event.target.value)}
                placeholder="0.00"
                className="mt-0.5 h-7 border-0 bg-transparent px-0 text-[1.05rem] font-extrabold text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </section>

        <form
          onSubmit={saveSavingsSource}
          className="pika-card pika-savings-card relative overflow-hidden rounded-[1.4rem] border border-brand-plum/[0.1] p-3.5"
        >
          <div className="pointer-events-none absolute -right-14 -top-20 h-36 w-36 rounded-full bg-brand-plum/[0.05] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-brand-plum/[0.1] text-brand-plum ring-1 ring-inset ring-brand-plum/[0.07]">
              <PiggyBank className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.88rem] font-extrabold text-foreground">Savings sources</h2>
              <p className="mt-0.5 truncate text-[0.68rem] font-medium text-muted-foreground">
                Track where each savings balance is kept.
              </p>
            </div>
            {editingSavingsId ? (
              <button
                type="button"
                onClick={resetSavingsForm}
                className="shrink-0 rounded-full bg-muted/60 px-2.5 py-1 text-[0.65rem] font-bold text-foreground ring-1 ring-inset ring-border/70"
              >
                Cancel
              </button>
            ) : (
              <span className="shrink-0 rounded-full bg-brand-plum/[0.09] px-2.5 py-1 text-[0.62rem] font-bold text-brand-plum ring-1 ring-inset ring-brand-plum/[0.08]">
                {plan.savingsSources.length} {plan.savingsSources.length === 1 ? "source" : "sources"}
              </span>
            )}
          </div>

          <div className="relative mt-3 grid grid-cols-[minmax(0,1fr)_minmax(7.25rem,0.7fr)] gap-2.5">
            <div className="pika-input-panel min-w-0 rounded-[1rem] border border-input bg-card px-3 py-2.5">
              <Label htmlFor="savings-source" className="text-[0.62rem] font-semibold text-muted-foreground">
                Savings source
              </Label>
              <Input
                id="savings-source"
                value={savingsForm.source}
                onChange={(event) => {
                  setSavingsForm((current) => ({ ...current, source: event.target.value }));
                  setSavingsFormError("");
                }}
                placeholder="e.g. Maybank or cash"
                className="mt-1 h-8 border-0 bg-transparent px-0 text-base font-bold text-foreground shadow-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="pika-input-panel min-w-0 rounded-[1rem] border border-input bg-card px-3 py-2.5">
              <Label htmlFor="savings-amount" className="text-[0.62rem] font-semibold text-muted-foreground">
                Current balance
              </Label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[0.72rem] font-extrabold text-brand-plum">
                  RM
                </span>
                <Input
                  id="savings-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={savingsForm.amount}
                  onChange={(event) => {
                    setSavingsForm((current) => ({ ...current, amount: event.target.value }));
                    setSavingsFormError("");
                  }}
                  placeholder="0.00"
                  className="h-8 border-0 bg-transparent pl-7 pr-0 text-base font-bold text-foreground shadow-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {savingsFormError && (
            <p className="relative mt-2.5 rounded-xl bg-rose-400/[0.08] px-3 py-2 text-[0.68rem] font-semibold text-destructive ring-1 ring-inset ring-rose-400/[0.12]">
              {savingsFormError}
            </p>
          )}

          <Button
            type="submit"
            className="pika-action pika-action-plum relative mt-3 h-10 w-full rounded-full text-[0.8rem] font-extrabold text-white ring-1 ring-inset ring-brand-plum/10"
          >
            {editingSavingsId ? <Save className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {editingSavingsId ? "Save source" : "Add savings source"}
          </Button>

          {plan.savingsSources.length === 0 ? (
            <p className="relative mt-3 rounded-[1rem] border border-dashed border-border/70 px-3 py-4 text-center text-[0.68rem] font-medium text-muted-foreground">
              No savings sources added yet.
            </p>
          ) : (
            <div className="relative mt-3 space-y-2">
              {plan.savingsSources.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] bg-brand-plum/[0.1] text-brand-plum">
                    <PiggyBank className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.76rem] font-bold text-foreground">{item.source}</p>
                    <p className="mt-0.5 text-[0.68rem] font-semibold text-brand-plum">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => editSavingsSource(item)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] text-muted-foreground transition hover:bg-muted/60 hover:text-brand-plum"
                    aria-label={`Edit ${item.source}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSavingsSource(item.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] text-muted-foreground transition hover:bg-rose-400/[0.08] hover:text-destructive"
                    aria-label={`Delete ${item.source}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between px-1 pt-1 text-[0.68rem] font-semibold text-muted-foreground">
                <span>Total savings</span>
                <span className="font-extrabold text-brand-plum">{formatCurrency(savings)}</span>
              </div>
            </div>
          )}

          <p className="relative mt-2 text-[0.62rem] font-medium text-muted-foreground">
            Savings are included in the summary and are not deducted from your next salary.
          </p>
        </form>

        <form
          onSubmit={saveCommitment}
          className="pika-card relative overflow-hidden rounded-[1.4rem] border border-border/70 p-3.5"
        >
          <div className="pointer-events-none absolute -left-16 -top-20 h-36 w-36 rounded-full bg-primary/[0.045] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/[0.1] text-primary ring-1 ring-inset ring-primary/[0.07]">
              <ReceiptText className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.88rem] font-extrabold text-foreground">
                {editingId ? "Edit commitment" : "Add future commitment"}
              </h2>
              <p className="mt-0.5 truncate text-[0.68rem] font-medium text-muted-foreground">
                Add a planned payment for the next salary.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="shrink-0 rounded-full bg-muted/60 px-2.5 py-1 text-[0.65rem] font-bold text-foreground ring-1 ring-inset ring-border/70"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="relative mt-3 grid grid-cols-[minmax(0,1fr)_minmax(7.25rem,0.7fr)] gap-2.5">
            <div className="pika-input-panel min-w-0 rounded-[1rem] border border-input bg-card px-3 py-2.5">
              <Label htmlFor="future-name" className="text-[0.62rem] font-semibold text-muted-foreground">
                Commitment
              </Label>
              <Input
                id="future-name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setFormError("");
                }}
                placeholder="e.g. House rent"
                className="mt-1 h-8 border-0 bg-transparent px-0 text-base font-bold text-foreground shadow-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="pika-input-panel min-w-0 rounded-[1rem] border border-input bg-card px-3 py-2.5">
              <Label htmlFor="future-amount" className="text-[0.62rem] font-semibold text-muted-foreground">
                Monthly payment
              </Label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[0.72rem] font-extrabold text-primary">
                  RM
                </span>
                <Input
                  id="future-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, amount: event.target.value }));
                    setFormError("");
                  }}
                  placeholder="0.00"
                  className="h-8 border-0 bg-transparent pl-7 pr-0 text-base font-bold text-foreground shadow-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          <div className="pika-input-panel relative mt-2.5 rounded-[1rem] border border-input bg-card px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="future-loan-balance" className="text-[0.62rem] font-semibold text-muted-foreground">
                Remaining loan balance
              </Label>
              <span className="text-[0.58rem] font-semibold text-muted-foreground">Optional — loans only</span>
            </div>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[0.72rem] font-extrabold text-brand-plum">
                RM
              </span>
              <Input
                id="future-loan-balance"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.remainingLoan}
                onChange={(event) => {
                  setForm((current) => ({ ...current, remainingLoan: event.target.value }));
                  setFormError("");
                }}
                placeholder="0.00"
                className="h-8 border-0 bg-transparent pl-7 pr-0 text-base font-bold text-foreground shadow-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <p className="mt-1 text-[0.6rem] font-medium text-muted-foreground">
              Enter the total still owed; the monthly payment remains separate above.
            </p>
          </div>

          {formError && (
            <p className="relative mt-2.5 rounded-xl bg-rose-400/[0.08] px-3 py-2 text-[0.68rem] font-semibold text-destructive ring-1 ring-inset ring-rose-400/[0.12]">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="pika-action relative mt-3 h-10 w-full rounded-full text-[0.8rem] font-extrabold text-white ring-1 ring-inset ring-primary/10"
          >
            {editingId ? <Save className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {editingId ? "Save commitment" : "Add commitment"}
          </Button>
        </form>

        <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Planned commitments
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Monthly total {formatCurrency(totalCommitments)} · Loans {formatCurrency(totalLoanBalance)}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              {plan.commitments.length}
            </span>
          </div>

          {plan.commitments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
              <ReceiptText className="mx-auto h-7 w-7 text-foreground dark:text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-muted-foreground dark:text-foreground">
                No future commitments yet
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add your expected payments to see how much salary will remain.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {plan.commitments.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 p-3 dark:bg-background"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-extrabold text-violet-600 dark:text-brand-plum">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                        Monthly {formatCurrency(item.amount)}
                      </p>
                      {item.remainingLoan > 0 && (
                        <p className="text-[11px] font-semibold text-violet-600 dark:text-brand-plum">
                          Balance {formatCurrency(item.remainingLoan)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => editCommitment(item)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted/70 dark:hover:bg-muted"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCommitment(item.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileLayout>
  );
}
