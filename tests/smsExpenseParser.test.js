import assert from "node:assert/strict";
import test from "node:test";
import { parseSmsExpense } from "../src/utils/smsExpenseParser.js";

const keetaSms = `Online Purchase
By: ***1234;mada(Apple Pay)
From: ***001
Amount: SAR 33.82
At: Keeta××Riyadh×
Date: 2026-08-27 01:40:09`;

test("reads a mada Apple Pay purchase with a currency prefix and ISO date", () => {
  assert.deepEqual(parseSmsExpense(keetaSms), {
    ok: true,
    data: {
      date: "2026-08-27",
      amount: 33.82,
      category: "Food",
      payment_method: "E-Wallet",
      description: "Keeta Riyadh",
    },
    merchant: "Keeta Riyadh",
    amount: 33.82,
    date: "2026-08-27",
    missing: [],
    usedTotalDue: false,
  });
});

test("handles CRLF, label casing, indentation, and nonbreaking spaces", () => {
  const sms = keetaSms.replaceAll("\n", "\r\n  ")
    .replace("Amount: SAR 33.82", "aMoUnT : sar\u00a033.82");
  assert.deepEqual(parseSmsExpense(sms), parseSmsExpense(keetaSms));
});

test("accepts SAR and SR on either side of amounts, including thousands", () => {
  for (const amount of ["SAR 1,234.56", "1,234.56 SAR", "SR 1,234.56", "1,234.56 SR"]) {
    const parsed = parseSmsExpense(keetaSms.replace("SAR 33.82", amount));
    assert.equal(parsed.amount, 1234.56, amount);
    assert.deepEqual(parsed.missing, [], amount);
  }
});

test("still prefers total due in SAR so overseas card fees are included", () => {
  for (const total of ["SAR 36.50", "36.50 SAR", "SR 36.50", "36.50 SR"]) {
    const parsed = parseSmsExpense(`Online Purchase
Card: VISA ***1234
Transaction Amount: 8.00 USD
Amount: 30.00 SAR
Total due amount: ${total}
From: STEAM
At: 27/08/26 01:40`);
    assert.equal(parsed.amount, 36.5);
    assert.equal(parsed.usedTotalDue, true);
    assert.equal(parsed.date, "2026-08-27");
    assert.equal(parsed.data.description, "STEAM");
    assert.equal(parsed.data.category, "Entertainment");
    assert.equal(parsed.data.payment_method, "Card");
  }
});

test("supports the existing Transaction Amount label and optional colon", () => {
  for (const line of ["Transaction Amount: SAR 33.82", "Transaction Amount 33.82 SAR"]) {
    assert.equal(parseSmsExpense(keetaSms.replace("Amount: SAR 33.82", line)).amount, 33.82);
  }
});

test("keeps dates in the bank's calendar without time zone conversion", () => {
  for (const date of ["2026-08-27 01:40:09", "27/08/2026 01:40:09", "27/08/26 01:40", "27/8/26"]) {
    assert.equal(parseSmsExpense(keetaSms.replace("2026-08-27 01:40:09", date)).date, "2026-08-27");
  }
});

test("prefers the explicit Date field over dates elsewhere in the message", () => {
  const parsed = parseSmsExpense(`Previous transaction 01/07/2026\n${keetaSms}`);
  assert.equal(parsed.date, "2026-08-27");
});

test("validates calendar dates, including leap years", () => {
  for (const date of ["2026-02-29", "2026-08-32", "2026-13-27", "31/04/26"]) {
    const parsed = parseSmsExpense(keetaSms.replace("2026-08-27 01:40:09", date));
    assert.equal(parsed.date, null, date);
    assert.deepEqual(parsed.missing, ["date"], date);
    assert.equal(Object.hasOwn(parsed.data, "date"), false, date);
  }
  assert.equal(parseSmsExpense(keetaSms.replace("2026-08-27", "2028-02-29")).date, "2028-02-29");
});

test("prefers the merchant At field to the source account", () => {
  for (const from of ["***001", "XXXX 001", "Account ***001", "Salary Account"]) {
    const parsed = parseSmsExpense(keetaSms.replace("From: ***001", `From: ${from}`));
    assert.equal(parsed.data.description, "Keeta Riyadh", from);
  }
});

test("ignores At timestamps and preserves older From merchant messages", () => {
  for (const date of ["27/08/26 01:40", "27/08/2026 01:40:09", "2026-08-27 01:40:09"]) {
    const parsed = parseSmsExpense(`Online Purchase
Amount: 33.82 SAR
From: HUNGERSTATION
At: ${date}`);
    assert.equal(parsed.merchant, "HUNGERSTATION");
    assert.equal(parsed.date, "2026-08-27");
    assert.equal(parsed.data.category, "Hungerstation");
  }
});

test("finds the merchant when multiple At fields include a timestamp", () => {
  const parsed = parseSmsExpense(keetaSms.replace("At: Keeta", "At: 2026-08-27 01:40:09\nAt: Keeta"));
  assert.equal(parsed.merchant, "Keeta Riyadh");
});

test("uses the recipient for outward transfers even when From is present", () => {
  const parsed = parseSmsExpense(`Internal Outward Transfer
From: Salary Account
To: Example Recipient
Amount: SAR 250.00
At: 27/08/2026 01:40:09`);
  assert.equal(parsed.data.description, "Transfer to Example Recipient");
  assert.equal(parsed.data.category, "Other");
  assert.equal(parsed.data.payment_method, "Online Transfer");
  assert.equal(parsed.amount, 250);
  assert.equal(parsed.date, "2026-08-27");
});

test("does not use masked accounts or the next line as a missing merchant", () => {
  for (const from of ["***001", "XXXX 001", "Account ***001", ""]) {
    const sms = keetaSms.replace("From: ***001", `From: ${from}`).replace("At: Keeta××Riyadh×\n", "");
    const parsed = parseSmsExpense(sms);
    assert.equal(parsed.merchant, "", from);
    assert.equal(Object.hasOwn(parsed.data, "description"), false, from);
  }
});

test("never substitutes the balance, card number, or a foreign amount", () => {
  for (const line of ["", "Amount:\n", "Amount: 8.00 USD\n", "Amount: SAR 0.00\n", "Amount: SAR -3.00\n"]) {
    const sms = keetaSms.replace("Amount: SAR 33.82\n", line) + "\nBalance: SAR 9,999.00";
    const parsed = parseSmsExpense(sms);
    assert.equal(parsed.amount, null, line);
    assert.deepEqual(parsed.missing, ["amount"], line);
    assert.equal(Object.hasOwn(parsed.data, "amount"), false, line);
  }
});

test("reports a missing date instead of silently inventing today's date", () => {
  const parsed = parseSmsExpense(keetaSms.replace("Date: 2026-08-27 01:40:09", ""));
  assert.equal(parsed.date, null);
  assert.deepEqual(parsed.missing, ["date"]);
});

test("rejects empty and unrecognized messages", () => {
  for (const sms of ["", "   ", null, "Your verification code is 123456", "From: ***001"]) {
    assert.equal(parseSmsExpense(sms).ok, false);
  }
});
