function parseMoney(value) {
  if (!value) return null;
  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseSarAmount(text, labelPattern) {
  // Banks put the currency either before or after the transaction amount.
  const match = text.match(new RegExp(
    `${labelPattern}[^\\S\\n]*:?[^\\S\\n]*(?:(?:SAR|SR)[^\\S\\n]*([\\d,.]+)|([\\d,.]+)[^\\S\\n]*(?:SAR|SR)\\b)`,
    "im",
  ));
  return parseMoney(match?.[1] || match?.[2]);
}

function parseBankDate(text) {
  const dateText = getLineValue(text, "Date") || text;
  const isoMatch = dateText.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const match = isoMatch || dateText.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/);
  if (!match) return null;

  const day = Number(match[isoMatch ? 3 : 1]);
  const month = Number(match[2]);
  let year = Number(match[isoMatch ? 1 : 3]);
  if (!isoMatch && year < 100) year += 2000;

  // Keep the bank's calendar date, regardless of the device's time zone.
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function getLineValues(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.matchAll(new RegExp(`^[^\\S\\n]*${escaped}[^\\S\\n]*:[^\\S\\n]*(.*)$`, "gim"));
  return [...matches].map((match) => match[1].trim()).filter(Boolean);
}

function getLineValue(text, label) {
  return getLineValues(text, label)[0] || "";
}

function getMerchant(text) {
  const isTransfer = /INTERNAL\s+OUTWARD\s+TRANSFER/i.test(text);
  const labels = isTransfer ? ["To", "At", "From"] : ["At", "From", "To"];

  for (const label of labels) {
    for (const value of getLineValues(text, label)) {
      // "From" can be the charged account, while "At" can be a timestamp.
      if (/^(?:(?:account|a\/c|card)\s*)?[*x×•#\d\s-]+$/i.test(value)) continue;
      if (/^(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s|T|$)/.test(value)) continue;

      const merchant = value.replace(/×+/g, " ").replace(/\s+/g, " ").trim();
      if (merchant) return { merchant, source: label.toLowerCase() };
    }
  }

  return { merchant: "", source: "" };
}

function inferCategory(merchant, text) {
  const haystack = `${merchant} ${text}`.toUpperCase();
  const mappings = [
    [/HUNGER|HUNGERSTATION/, "Hungerstation"],
    [/STEAM/, "Entertainment"],
    [/KEETA|FAWAL|RESTAURANT|CAFE|COFFEE|FOOD|BAKERY|BROAST|SHAWARMA/, "Food"],
    [/PANDA|DANUBE|CARREFOUR|TAMIMI|LULU|GROCERY|SUPERMARKET/, "Groceries"],
    [/UBER|CAREEM|TAXI|METRO|RAIL|PETROL|FUEL|GAS STATION/, "Transport"],
    [/NAHDI|PHARMACY|HOSPITAL|CLINIC|MEDICAL/, "Healthcare"],
    [/STC|MOBILY|ZAIN|ELECTRIC|WATER|UTILITY|INTERNET/, "Bills"],
    [/AMAZON|NOON|SHEIN|TEMU|ALIEXPRESS|SHOP/, "Shopping"],
  ];

  const matched = mappings.find(([pattern]) => pattern.test(haystack));
  if (matched) return matched[1];
  if (/INTERNAL\s+OUTWARD\s+TRANSFER/i.test(text)) return "Other";
  if (/ONLINE\s+PURCHASE/i.test(text)) return "Shopping";
  return "Other";
}

function inferPaymentMethod(text) {
  if (/INTERNAL\s+OUTWARD\s+TRANSFER/i.test(text)) return "Online Transfer";
  if (/APPLE\s*PAY/i.test(text)) return "E-Wallet";
  if (/\bVISA\b|^\s*CARD\s*:|ONLINE\s+PURCHASE/im.test(text)) return "Card";
  return "";
}

export function parseSmsExpense(rawText) {
  const text = String(rawText || "").replace(/\r\n?/g, "\n").trim();
  if (!text) {
    return { ok: false, error: "Paste a bank SMS first." };
  }

  const totalDue = parseSarAmount(text, "\\bTotal\\s+due\\s+amount");
  const amountLine = parseSarAmount(text, "^[^\\S\\n]*Amount");
  const transactionAmount = parseSarAmount(text, "\\bTransaction\\s+Amount");
  const amount = totalDue || amountLine || transactionAmount;
  const date = parseBankDate(text);
  const { merchant, source } = getMerchant(text);
  const isTransfer = /INTERNAL\s+OUTWARD\s+TRANSFER/i.test(text);

  const data = {};
  if (date) data.date = date;
  if (amount) data.amount = amount;
  data.category = inferCategory(merchant, text);
  data.payment_method = inferPaymentMethod(text);
  if (merchant) data.description = isTransfer && source === "to" ? `Transfer to ${merchant}` : merchant;

  const missing = [];
  if (!amount) missing.push("amount");
  if (!date) missing.push("date");

  if (!amount && !date && !merchant) {
    return {
      ok: false,
      error: "I couldn't recognize this SMS format yet. Paste the complete bank transaction message.",
    };
  }

  return {
    ok: true,
    data,
    merchant,
    amount,
    date,
    missing,
    usedTotalDue: Boolean(totalDue),
  };
}
