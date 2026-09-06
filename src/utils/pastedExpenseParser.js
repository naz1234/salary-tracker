import { parseSmsExpense } from "./smsExpenseParser.js";

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const rmAmountLine = /^[+\-−–]?\s*(?:RM|MYR)\s*[+\-−–]?\s*\d[\d,.]*$/i;
const referenceLine = /^(?:QR\d{5,}|\d{8,}|[a-f\d]{16,}\*?)$/i;

function dateOnly(year, month, day) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function readDateLine(line, now) {
  if (/^(today|yesterday)$/i.test(line)) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (/^yesterday$/i.test(line)) date.setDate(date.getDate() - 1);
    return { date: dateOnly(date.getFullYear(), date.getMonth() + 1, date.getDate()), relative: line };
  }

  const words = line.match(/^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})$/i);
  if (words) return { date: dateOnly(Number(words[3]), months.indexOf(words[2].slice(0, 3).toLowerCase()) + 1, Number(words[1])) };
  const iso = line.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { date: dateOnly(Number(iso[1]), Number(iso[2]), Number(iso[3])) };
  const slash = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return { date: dateOnly(Number(slash[3]), Number(slash[2]), Number(slash[1])) };
  return null;
}

function readRmAmount(line) {
  const match = line.replace(/[−–]/g, "-").match(/^([+-]?)\s*(?:RM|MYR)\s*([+-]?)\s*(.+)$/i);
  if (!match || (match[1] && match[2])) return null;
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(match[3])) return null;
  const amount = Number(match[3].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, sign: match[1] || match[2] };
}

function cleanDescription(line) {
  return line.replace(/^[a-f\d]{16,}\*\s*/i, "").replace(/^In\s+Store\s*[-–—:]\s*/i, "").trim();
}

function inferRmCategory(description) {
  if (/\b(?:99\s*speedmart|speedmart|grocery|groceries|supermarket|mydin|lotus'?s|aeon)\b/i.test(description)) return "Groceries";
  if (/\b(?:yuran|api\s+air|bil|electric|water|utility|internet)\b/i.test(description)) return "Bills";
  if (/\b(?:restaurant|restoran|cafe|coffee|food|bakery)\b/i.test(description)) return "Food";
  return "Other";
}

function readRmList(text, now) {
  const entries = [];
  let descriptionLines = [];
  let bnpl = false;
  let headerDate = null;
  let itemDate = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || referenceLine.test(line)) continue;

    if (/^BNPL$/i.test(line)) {
      if (bnpl || descriptionLines.length) return { ok: false, error: "An entry is missing its amount. Paste complete transactions and try again." };
      bnpl = true;
      itemDate = null;
      continue;
    }

    const date = readDateLine(line, now);
    if (date) {
      // A date inside a BNPL card belongs only to that purchase. Bank-list
      // date headings apply to following rows, never to earlier undated rows.
      if (bnpl || descriptionLines.length) itemDate = date;
      else headerDate = date;
      continue;
    }

    if (rmAmountLine.test(line)) {
      const money = readRmAmount(line);
      const description = descriptionLines.map(cleanDescription).filter(Boolean).join(" · ");
      if (!money || !description) return { ok: false, error: `Check the amount and merchant for entry ${entries.length + 1}.` };
      if (money.sign === "+" || (!bnpl && money.sign !== "-") || /\b(?:balance|refund|credited|received)\b/i.test(description)) {
        return { ok: false, error: "This paste includes an incoming payment, balance or unsigned bank amount. Paste outgoing expenses only; unsigned BNPL purchases are supported." };
      }

      const selectedDate = itemDate || headerDate;
      const parsedDate = selectedDate?.date || null;
      const merchant = description.replace(/^DUITNOW\s+QR\s+/i, "");
      entries.push({
        ok: true,
        data: {
          ...(parsedDate ? { date: parsedDate } : {}),
          amount: money.amount,
          category: inferRmCategory(description),
          description,
          payment_method: bnpl ? "BNPL" : "Online Transfer",
        },
        merchant,
        amount: money.amount,
        date: parsedDate,
        missing: parsedDate ? [] : ["date"],
        usedTotalDue: false,
        sourceCurrency: "MYR",
        relativeDate: selectedDate?.relative || "",
      });
      descriptionLines = [];
      itemDate = null;
      bnpl = false;
      continue;
    }

    descriptionLines.push(line);
  }

  if (bnpl || descriptionLines.length) return { ok: false, error: "The last entry is missing a readable amount. Paste the complete transaction and try again." };
  return entries.length ? { ok: true, entries } : { ok: false, error: "No outgoing transactions were found in this paste." };
}

export function createExpenseDraft(parsed) {
  return {
    date: parsed.data.date || "",
    amount: parsed.data.amount ? String(parsed.data.amount) : "",
    category: parsed.data.category || "",
    description: parsed.data.description || "",
    payment_method: parsed.data.payment_method || "",
  };
}

export function parseExpensePaste(rawText, { now = new Date() } = {}) {
  const text = String(rawText || "").replace(/\r\n?/g, "\n").replace(/[\u00a0\u202f]/g, " ").trim();
  if (!text) return { ok: false, error: "Paste a bank SMS or transaction list first." };

  if (text.split("\n").some(line => rmAmountLine.test(line.trim()))) {
    if (/^(?:Amount|Transaction\s+Amount|Total\s+due\s+amount)\s*:?[^\n]*\b(?:SAR|SR)\b/im.test(text)) {
      return { ok: false, error: "Paste RM transaction lists and SAR bank messages separately." };
    }
    return readRmList(text, now);
  }

  const headers = text.match(/^[^\S\n]*(?:Online Purchase|Internal Outward Transfer)[^\S\n]*$/gim) || [];
  const messages = headers.length > 1
    ? text.split(/(?=^[^\S\n]*(?:Online Purchase|Internal Outward Transfer)[^\S\n]*$)/im).filter(part => part.trim())
    : [text];
  const entries = messages.map(parseSmsExpense);
  const failed = entries.find(entry => !entry.ok);
  return failed || { ok: true, entries };
}
