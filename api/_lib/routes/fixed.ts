import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, createPage, propString, propNumber, propCheckbox, propDateStart } from "../notion.js";
import { monthOf, todayKST, monthDateRange } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

/** Fixed Expense's 대출/카드 collapse into Finance's single "카드/대출" Type (WORK-ORDER). */
const FIXED_TO_FINANCE_TYPE: Record<string, string> = { 대출: "카드/대출", 카드: "카드/대출" };

interface FixedRow {
  id: string;
  name: string;
  type: string;
  amount: number;
  dueDay: number;
  variable: boolean;
  remaining: string;
}

/** Active fixed-expense rows whose End date hasn't passed yet (or has none). */
async function activeFixedRows(today: string): Promise<FixedRow[]> {
  const result = await queryDatabase(DB.fixedExpense, {
    filter: {
      and: [
        { property: "Active", checkbox: { equals: true } },
        {
          or: [
            { property: "End", date: { is_empty: true } },
            { property: "End", date: { on_or_after: today } },
          ],
        },
      ],
    },
    sorts: [{ property: "Due day", direction: "ascending" }],
    page_size: 100,
  });
  return result.results.map((page) => ({
    id: page.id,
    name: propString(page.properties["Name"]),
    type: propString(page.properties["Type"]),
    amount: propNumber(page.properties["Amount"]),
    dueDay: propNumber(page.properties["Due day"]),
    variable: propCheckbox(page.properties["Variable"]),
    remaining: propString(page.properties["Remaining"]),
  }));
}

interface FinanceEntry {
  name: string;
  amount: number;
  day: number;
}

/** This month's Finance rows, reduced to what identifies which Fixed Expense
 *  row they came from — the dedup + "reflected" check share this. */
async function financeEntriesInMonth(month: string): Promise<FinanceEntry[]> {
  const result = await queryDatabase(DB.finance, {
    filter: { property: "Month", formula: { string: { equals: month } } },
    page_size: 200,
  });
  return result.results.map((page) => {
    const start = propDateStart(page.properties["Date"]);
    return {
      name: propString(page.properties["Name"]),
      amount: Math.abs(propNumber(page.properties["Amount"])),
      day: start ? Number(start.slice(-2)) : 0,
    };
  });
}

/** Same Name + due day identifies "this fixed expense, already reflected this
 *  month" — several Fixed Expense rows can share a Name (e.g. three separate
 *  loans all called "학자금"), so Name alone isn't enough. Amount also has to
 *  match for non-Variable rows, since two same-named/same-day rows could
 *  still differ in amount; Variable rows skip that check because their
 *  amount is expected to change every month. */
function isReflected(entries: FinanceEntry[], row: FixedRow, expectedDay: number): boolean {
  return entries.some(
    (e) => e.name === row.name && e.day === expectedDay && (row.variable || e.amount === row.amount)
  );
}

async function budgetPageId(month: string): Promise<string | null> {
  const result = await queryDatabase(DB.budget, {
    filter: { property: "Month", rich_text: { equals: month } },
    page_size: 1,
  });
  return result.results[0]?.id ?? null;
}

/** Due day clamped into the month (e.g. 31 in February) so the date is always valid. */
function dueDate(month: string, dueDay: number): string {
  const daysInMonth = Number(monthDateRange(month).end.slice(-2));
  const day = Math.min(Math.max(dueDay || 1, 1), daysInMonth);
  return `${month.replace(".", "-")}-${String(day).padStart(2, "0")}`;
}

async function handleGet(res: ApiResponse, month: string, today: string) {
  const [rows, entries] = await Promise.all([activeFixedRows(today), financeEntriesInMonth(month)]);
  const items = rows.map((r) => ({
    ...r,
    reflected: isReflected(entries, r, Number(dueDate(month, r.dueDay).slice(-2))),
  }));
  withCache(res);
  res.status(200).json({ month, items });
}

async function handlePost(res: ApiResponse, month: string, today: string, amounts: Record<string, number>) {
  const [rows, entries, budgetId] = await Promise.all([
    activeFixedRows(today),
    financeEntriesInMonth(month),
    budgetPageId(month),
  ]);

  let created = 0;
  const skipped: { name: string; reason: "duplicate" | "amount-missing" | "error" }[] = [];

  // Sequential, not Promise.all — Notion's API is rate-limited to ~3 req/s.
  // Each create is isolated: one row's Notion error (e.g. a blank Type) must
  // not abort the rows still queued behind it.
  for (const r of rows) {
    const expectedDay = Number(dueDate(month, r.dueDay).slice(-2));
    if (isReflected(entries, r, expectedDay)) {
      skipped.push({ name: r.name, reason: "duplicate" });
      continue;
    }
    const amount = r.variable ? amounts[r.id] : r.amount;
    if (!amount || amount <= 0) {
      skipped.push({ name: r.name, reason: "amount-missing" });
      continue;
    }

    const financeType = FIXED_TO_FINANCE_TYPE[r.type] ?? "Expense";
    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: r.name } }] },
      Amount: { number: -Math.abs(amount) },
      Type: { select: { name: financeType } },
      Date: { date: { start: dueDate(month, r.dueDay) } },
    };
    if (r.type) properties["Category"] = { select: { name: r.type } };
    if (budgetId) properties["Budget"] = { relation: [{ id: budgetId }] };

    try {
      await createPage(DB.finance, properties);
      created++;
    } catch (err) {
      console.error("[fixed] createPage failed", r.name, err);
      skipped.push({ name: r.name, reason: "error" });
    }
  }

  res.status(200).json({ ok: true, created, skipped: skipped.length, skippedDetails: skipped });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const today = todayKST();
  const queryMonth = typeof req.query.month === "string" ? req.query.month : undefined;

  try {
    if (req.method === "POST") {
      const body = (req.body ?? {}) as { month?: string; amounts?: Record<string, number> };
      await handlePost(res, body.month ?? queryMonth ?? monthOf(), today, body.amounts ?? {});
    } else {
      await handleGet(res, queryMonth ?? monthOf(), today);
    }
  } catch (err) {
    sendError(res, err, { endpoint: "fixed", databaseId: DB.fixedExpense });
  }
}
