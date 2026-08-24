import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Pencil,
  Plus,
  ReceiptText,
  Save,
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
  commitments: [],
};

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `future-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
      commitments: Array.isArray(stored.commitments)
        ? stored.commitments
            .filter((item) => item && item.name && Number(item.amount) > 0)
            .map((item) => ({
              id: String(item.id || makeId()),
              name: String(item.name),
              amount: Number(item.amount),
            }))
        : [],
    };
  } catch {
    return emptyPlan;
  }
}

function formatCurrency(value) {
  return `⃁ ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FutureExpenses() {
  const [plan, setPlan] = useState(loadPlan);
  const [form, setForm] = useState({ name: "", amount: "" });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const expectedSalary = Math.max(0, Number(plan.expectedSalary) || 0);
  const totalCommitments = useMemo(
    () => plan.commitments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [plan.commitments],
  );
  const remaining = expectedSalary - totalCommitments;
  const overBudget = remaining < 0;
  const commitmentPercent =
    expectedSalary > 0 ? Math.min(100, (totalCommitments / expectedSalary) * 100) : 0;

  const updateExpectedSalary = (value) => {
    if (value !== "" && Number(value) < 0) return;
    setPlan((current) => ({ ...current, expectedSalary: value }));
  };

  const resetForm = () => {
    setForm({ name: "", amount: "" });
    setEditingId(null);
    setFormError("");
  };

  const saveCommitment = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const amount = Number(form.amount);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a commitment name and an amount above zero.");
      return;
    }

    setPlan((current) => ({
      ...current,
      commitments: editingId
        ? current.commitments.map((item) =>
            item.id === editingId ? { ...item, name, amount } : item,
          )
        : [...current.commitments, { id: makeId(), name, amount }],
    }));
    resetForm();
  };

  const editCommitment = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, amount: String(item.amount) });
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
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            Future Expenses
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Plan your next salary before it arrives.
          </p>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm dark:border-emerald-500/25 dark:from-[#06271f] dark:via-[#07131a] dark:to-[#07101d]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                <WalletCards className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Expected next salary
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  {formatCurrency(expectedSalary)}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {plan.commitments.length} {plan.commitments.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-orange-500/20 bg-white/65 p-3 dark:bg-black/15">
              <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-[11px] font-semibold">Commitments</span>
              </div>
              <p className="mt-1.5 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalCommitments)}
              </p>
            </div>

            <div
              className={`rounded-2xl border bg-white/65 p-3 dark:bg-black/15 ${
                overBudget ? "border-rose-500/25" : "border-emerald-500/20"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 ${
                  overBudget
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <CircleDollarSign className="h-4 w-4" />
                <span className="text-[11px] font-semibold">
                  {overBudget ? "Shortfall" : "Remaining"}
                </span>
              </div>
              <p
                className={`mt-1.5 text-sm font-extrabold ${
                  overBudget
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {formatCurrency(Math.abs(remaining))}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Salary allocated</span>
              <span>{expectedSalary > 0 ? `${Math.round((totalCommitments / expectedSalary) * 100)}%` : "0%"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${
                  overBudget ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${commitmentPercent}%` }}
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[1.4rem] border border-emerald-300/[0.1] bg-[linear-gradient(135deg,rgba(5,42,34,0.78),rgba(6,18,22,0.97))] p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.24)]">
          <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-emerald-400/[0.07] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-400/[0.11] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.08]">
              <BriefcaseBusiness className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.88rem] font-extrabold text-white">Next-job salary</h2>
              <p className="mt-0.5 truncate text-[0.68rem] font-medium text-slate-400">
                Set the take-home amount for your next plan.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-400/[0.09] px-2.5 py-1 text-[0.62rem] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/[0.08]">
              Auto-saved
            </span>
          </div>

          <div className="relative mt-3 flex items-center gap-2.5 rounded-[1rem] border border-white/[0.075] bg-black/[0.16] px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-white/[0.05] text-[0.85rem] font-extrabold text-emerald-400 ring-1 ring-inset ring-white/[0.06]">
              ⃁
            </span>
            <div className="min-w-0 flex-1">
              <Label htmlFor="future-salary" className="text-[0.62rem] font-semibold text-slate-400">
                Expected take-home
              </Label>
              <Input
                id="future-salary"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={plan.expectedSalary}
                onChange={(event) => updateExpectedSalary(event.target.value)}
                placeholder="0.00"
                className="mt-0.5 h-7 border-0 bg-transparent px-0 text-[1.05rem] font-extrabold text-white shadow-none placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </section>

        <form
          onSubmit={saveCommitment}
          className="relative overflow-hidden rounded-[1.4rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(12,23,27,0.98),rgba(5,13,17,0.99))] p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
        >
          <div className="pointer-events-none absolute -left-16 -top-20 h-36 w-36 rounded-full bg-emerald-400/[0.045] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-400/[0.1] text-emerald-400 ring-1 ring-inset ring-emerald-300/[0.07]">
              <ReceiptText className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.88rem] font-extrabold text-white">
                {editingId ? "Edit commitment" : "Add future commitment"}
              </h2>
              <p className="mt-0.5 truncate text-[0.68rem] font-medium text-slate-400">
                Add a planned payment for the next salary.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="shrink-0 rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.65rem] font-bold text-slate-300 ring-1 ring-inset ring-white/[0.07]"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="relative mt-3 grid grid-cols-[minmax(0,1fr)_minmax(7.25rem,0.7fr)] gap-2.5">
            <div className="min-w-0 rounded-[1rem] border border-white/[0.07] bg-black/[0.14] px-3 py-2.5">
              <Label htmlFor="future-name" className="text-[0.62rem] font-semibold text-slate-400">
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
                className="mt-1 h-8 border-0 bg-transparent px-0 text-[0.8rem] font-bold text-white shadow-none placeholder:font-medium placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="min-w-0 rounded-[1rem] border border-white/[0.07] bg-black/[0.14] px-3 py-2.5">
              <Label htmlFor="future-amount" className="text-[0.62rem] font-semibold text-slate-400">
                Amount
              </Label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[0.72rem] font-extrabold text-emerald-400">
                  ⃁
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
                  className="h-8 border-0 bg-transparent pl-5 pr-0 text-[0.8rem] font-bold text-white shadow-none placeholder:font-medium placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {formError && (
            <p className="relative mt-2.5 rounded-xl bg-rose-400/[0.08] px-3 py-2 text-[0.68rem] font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/[0.12]">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="relative mt-3 h-10 w-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-[0.8rem] font-extrabold text-white shadow-[0_12px_24px_rgba(16,185,129,0.13)] ring-1 ring-inset ring-emerald-300/10 hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-600"
          >
            {editingId ? <Save className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {editingId ? "Save commitment" : "Add commitment"}
          </Button>
        </form>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#202733] dark:bg-[#090d12]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Planned commitments
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Total {formatCurrency(totalCommitments)}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-[#10151c] dark:text-slate-400">
              {plan.commitments.length}
            </span>
          </div>

          {plan.commitments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-[#28313e]">
              <ReceiptText className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                No future commitments yet
              </p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Add your expected payments to see how much salary will remain.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {plan.commitments.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#202733] dark:bg-[#060a0f]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-extrabold text-violet-600 dark:text-violet-400">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => editCommitment(item)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-[#151b23]"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCommitment(item.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
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
