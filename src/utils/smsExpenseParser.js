function parseMoney(value) {
  if (!value) return null;
  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseBankDate(text) {
  const match = String(text || "").match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

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

function getLineValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(text || "").match(new RegExp(`^\\s*${escaped}\\s*:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() || "";
}

function getMerchant(text) {
  const from = getLineValue(text, "From");
  if (from) return { merchant: from, source: "from" };

  const to = getLineValue(text, "To");
  if (to) return { merchant: to, source: "to" };

  const atMatches = [...String(text || "").matchAll(/^\s*At\s*:\s*(.+)$/gim)];
  const merchantAt = atMatches
    .map((match) => match[1].trim())
    .find((value) => !/^\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+\d{1,2}:\d{2})?$/.test(value));

  return { merchant: merchantAt || "", source: merchantAt ? "at" : "" };
}

function inferCategory(merchant, text) {
  const haystack = `${merchant} ${text}`.toUpperCase();
  const mappings = [
    [/HUNGER|HUNGERSTATION/, "Hungerstation"],
    [/STEAM/, "Entertainment"],
    [/FAWAL|RESTAURANT|CAFE|COFFEE|FOOD|BAKERY|BROAST|SHAWARMA/, "Food"],
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

  const totalDue = text.match(/\bTotal\s+due\s+amount\s*:\s*([\d,.]+)\s*(?:SAR|SR)\b/i);
  const amountLine = text.match(/^\s*Amount\s*:\s*([\d,.]+)\s*(?:SAR|SR)\b/im);
  const transactionAmount = text.match(/\bTransaction\s+Amount\s*:?\s*([\d,.]+)\s*(?:SAR|SR)\b/i);
  const amount = parseMoney(totalDue?.[1] || amountLine?.[1] || transactionAmount?.[1]);
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
