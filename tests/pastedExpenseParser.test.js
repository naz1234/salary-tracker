import assert from "node:assert/strict";
import test from "node:test";
import { createExpenseDraft, parseExpensePaste } from "../src/utils/pastedExpenseParser.js";
import { parseSmsExpense } from "../src/utils/smsExpenseParser.js";

const now = new Date(2026, 8, 6, 12);
const bnpl = `BNPL
In Store - Alaf Salak Tinggi
06 Sep 2026
RM17.30`;
// Same bank formats as the reported paste, with recipients/references anonymized.
const pasted = `${bnpl}

BNPL
In Store - 99 Speedmart
06 Sep 2026
RM18.50

EXAMPLE RECIPIENT* tng
-RM 100.00

EXAMPLE RECIPIENT* yuran, api air
-RM 730.00

Yesterday
DUITNOW QR EXAMPLEMERCHANT*
-RM 103.70
QR12345678

4 Sep 2026

2609041234567890
ABCDEF0123456789ABC* AXIATA DIGITAL
-RM 100.00`;

test("reads all six Malaysian entries separately without converting their amounts", () => {
  const result = parseExpensePaste(pasted, { now });
  assert.equal(result.ok, true);
  assert.equal(result.entries.length, 6);
  assert.deepEqual(result.entries.map(entry => entry.amount), [17.3, 18.5, 100, 730, 103.7, 100]);
  assert.deepEqual(result.entries.map(entry => entry.date), ["2026-09-06", "2026-09-06", null, null, "2026-09-05", "2026-09-04"]);
  assert.deepEqual(result.entries.map(entry => entry.data.description), [
    "Alaf Salak Tinggi", "99 Speedmart", "EXAMPLE RECIPIENT* tng",
    "EXAMPLE RECIPIENT* yuran, api air", "DUITNOW QR EXAMPLEMERCHANT*", "AXIATA DIGITAL",
  ]);
  assert.deepEqual(result.entries.map(entry => entry.data.category), ["Other", "Groceries", "Other", "Bills", "Other", "Other"]);
  assert.deepEqual(result.entries.map(entry => entry.data.payment_method), ["BNPL", "BNPL", "Online Transfer", "Online Transfer", "Online Transfer", "Online Transfer"]);
  assert.ok(result.entries.every(entry => entry.sourceCurrency === "MYR"));
  assert.deepEqual(result.entries[2].missing, ["date"]);
  assert.deepEqual(result.entries[3].missing, ["date"]);
  assert.equal(result.entries[4].relativeDate, "Yesterday");
});

test("also reads each reported format when pasted individually", () => {
  for (const [text, amount, date] of [
    [bnpl, 17.3, "2026-09-06"],
    [bnpl.replace("Alaf Salak Tinggi", "99 Speedmart").replace("17.30", "18.50"), 18.5, "2026-09-06"],
    ["EXAMPLE RECIPIENT* tng\n-RM 100.00", 100, null],
    ["EXAMPLE RECIPIENT* yuran, api air\n-RM 730.00", 730, null],
    ["Yesterday\nDUITNOW QR EXAMPLEMERCHANT*\n-RM 103.70\nQR12345678", 103.7, "2026-09-05"],
    ["4 Sep 2026\n2609041234567890\nABCDEF0123456789ABC* AXIATA DIGITAL\n-RM 100.00", 100, "2026-09-04"],
  ]) {
    const result = parseExpensePaste(text, { now });
    assert.equal(result.ok, true, text);
    assert.equal(result.entries.length, 1, text);
    assert.equal(result.entries[0].amount, amount, text);
    assert.equal(result.entries[0].date, date, text);
  }
});

test("supports mobile whitespace, Unicode minus, MYR and thousands", () => {
  const text = "Today\r\nDUITNOW QR EXAMPLE*\r\n−MYR\u00a01,085.67\r\nQR12345678";
  const parsed = parseExpensePaste(text, { now }).entries[0];
  assert.equal(parsed.amount, 1085.67);
  assert.equal(parsed.date, "2026-09-06");
  assert.equal(parsed.merchant, "EXAMPLE*");
  assert.equal(parseExpensePaste("EXAMPLE*\nRM -100.00", { now }).entries[0].amount, 100);
});

test("relative dates use the supplied local calendar, including month and year boundaries", () => {
  for (const [reference, expected] of [
    [new Date(2026, 0, 1, 0, 5), "2025-12-31"],
    [new Date(2028, 2, 1, 0, 5), "2028-02-29"],
    [new Date(2026, 2, 1, 0, 5), "2026-02-28"],
  ]) {
    assert.equal(parseExpensePaste("Yesterday\nEXAMPLE*\n-RM 10.00", { now: reference }).entries[0].date, expected);
  }
});

test("bank-list date headings apply forward but BNPL dates do not leak into undated transfers", () => {
  const text = "Today\nONE*\n-RM 10.00\nQR12345678\n\nTWO*\n-RM 20.00\nYesterday\nTHREE*\n-RM 30.00";
  assert.deepEqual(parseExpensePaste(text, { now }).entries.map(entry => entry.date), ["2026-09-06", "2026-09-06", "2026-09-05"]);
  const result = parseExpensePaste(`${bnpl}\nEXAMPLE*\n-RM 100.00`, { now });
  assert.equal(result.entries[1].date, null);
});

test("invalid dates stay missing instead of rolling over or reusing the last heading", () => {
  for (const invalid of ["31 Sep 2026", "29 Feb 2026", "2026-13-01", "31/04/2026"]) {
    const entry = parseExpensePaste(`Today\nONE*\n-RM 10.00\n${invalid}\nTWO*\n-RM 20.00`, { now }).entries[1];
    assert.equal(entry.date, null, invalid);
    assert.deepEqual(entry.missing, ["date"], invalid);
  }
  for (const valid of ["06 September 2026", "6 Sept 2026", "2026-09-06", "6/9/2026"]) {
    assert.equal(parseExpensePaste(bnpl.replace("06 Sep 2026", valid), { now }).entries[0].date, "2026-09-06");
  }
});

test("blocks credits, balances, malformed amounts and incomplete entries instead of importing partial lists", () => {
  for (const invalid of [
    "EXAMPLE*\n+RM 100.00", "Balance\n-RM 100.00", "EXAMPLE*\nRM 100.00",
    "EXAMPLE*\n-RM 1,00.00", "EXAMPLE*\n-RM 0.00", "EXAMPLE*\n-RM 1.234",
    "EXAMPLE*\n-RM -10.00", "-RM 10.00", "BNPL\nIn Store - Missing amount",
  ]) {
    assert.equal(parseExpensePaste(`${bnpl}\n\n${invalid}`, { now }).ok, false, invalid);
  }
});

test("new import drafts leave missing fields blank, never carrying an earlier amount or date", () => {
  assert.deepEqual(createExpenseDraft(parseExpensePaste("EXAMPLE*\n-RM 100.00", { now }).entries[0]), {
    date: "", amount: "100", category: "Other", description: "EXAMPLE*", payment_method: "Online Transfer",
  });
  assert.deepEqual(createExpenseDraft({ data: {} }), { date: "", amount: "", category: "", description: "", payment_method: "" });
});

const sar = `Online Purchase
By: ***1234;mada(Apple Pay)
From: ***001
Amount: SAR 33.82
At: Keeta××Riyadh×
Date: 2026-08-27 01:40:09`;

test("preserves the SAR SMS reader and separates multiple complete bank SMS", () => {
  for (const text of [sar, `Previous transaction 01/07/2026\n${sar}`]) {
    assert.deepEqual(parseExpensePaste(text).entries, [parseSmsExpense(text)]);
  }
  const result = parseExpensePaste(`${sar}\n\n${sar.replace("33.82", "34.07").replace("Keeta", "Hungerstation")}`);
  assert.equal(result.entries.length, 2);
  assert.deepEqual(result.entries.map(entry => entry.amount), [33.82, 34.07]);
  assert.deepEqual(result.entries.map(entry => entry.data.category), ["Food", "Hungerstation"]);
  assert.equal(parseExpensePaste(`${sar}\n${bnpl}`).ok, false);
});
