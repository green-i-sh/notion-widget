import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, propNumber, propString } from "./_lib/notion.js";
import { monthOf, prevMonthOf } from "./_lib/date.js";
import { sendError, withCache } from "./_lib/http.js";
import { DB } from "./_lib/db.js";

const FIXED_CATEGORIES = new Set(["주거", "통신", "보험", "구독"]);

async function categoryTotals(month: string): Promise<Map<string, number>> {
  const result = await queryDatabase(DB.finance, {
    filter: {
      and: [
        { property: "Month", formula: { string: { equals: month } } },
        { property: "Type", select: { equals: "Expense" } },
      ],
    },
    page_size: 200,
  });

  const totals = new Map<string, number>();
  for (const page of result.results) {
    const category = propString(page.properties["Category"]);
    if (!category || FIXED_CATEGORIES.has(category)) continue;
    const amount = Math.abs(propNumber(page.properties["Amount"]));
    totals.set(category, (totals.get(category) ?? 0) + amount);
  }
  return totals;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    const [thisTotals, lastTotals] = await Promise.all([categoryTotals(month), categoryTotals(prevMonthOf(month))]);
    const categories = [...new Set([...thisTotals.keys(), ...lastTotals.keys()])];
    const rows = categories
      .map((category) => {
        const amount = thisTotals.get(category) ?? 0;
        const delta = amount - (lastTotals.get(category) ?? 0);
        return { category, amount, delta };
      })
      .sort((a, b) => b.amount - a.amount);
    const total = rows.reduce((sum, r) => sum + r.amount, 0);

    withCache(res);
    res.status(200).json({ month, rows, total });
  } catch (err) {
    sendError(res, err, { endpoint: "category", databaseId: DB.finance });
  }
}
