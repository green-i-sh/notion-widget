import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propNumber, propDateRange, propFileUrl } from "../notion.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

interface CategoryAmount {
  category: string;
  amount: number;
}

/** Trips has no documented relation to Finance, so the trip's spend is every
 *  Expense-type Finance row dated within the trip's own Date range. */
async function tripExpense(start: string | null, end: string | null): Promise<{ total: number; categories: CategoryAmount[] }> {
  if (!start) return { total: 0, categories: [] };

  const result = await queryDatabase(DB.finance, {
    filter: {
      and: [
        { property: "Type", select: { equals: "Expense" } },
        { property: "Date", date: { on_or_after: start } },
        { property: "Date", date: { on_or_before: end ?? start } },
      ],
    },
    page_size: 200,
  });

  const byCategory = new Map<string, number>();
  let total = 0;
  for (const page of result.results) {
    const amount = Math.abs(propNumber(page.properties["Amount"]));
    const category = propString(page.properties["Category"]) || "기타";
    byCategory.set(category, (byCategory.get(category) ?? 0) + amount);
    total += amount;
  }

  const categories = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  return { total, categories };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const tripName = typeof req.query.trip === "string" ? req.query.trip : undefined;

  try {
    const result = await queryDatabase(DB.trips, {
      filter: tripName
        ? { property: "Name", title: { equals: tripName } }
        : { property: "Phase", select: { equals: "After Trip" } },
      page_size: 1,
    });

    const page = result.results[0];
    if (!page) {
      res.status(200).json({ found: false });
      return;
    }

    const p = page.properties;
    const range = propDateRange(p["Date"]);
    const start = range.start?.slice(0, 10) ?? null;
    const end = range.end?.slice(0, 10) ?? null;
    const expense = await tripExpense(start, end);

    withCache(res);
    res.status(200).json({
      found: true,
      name: propString(p["Name"]),
      phase: propString(p["Phase"]),
      cover: propFileUrl(p["Cover"]),
      start,
      end,
      people: propNumber(p["인원"]) || null,
      columns: [
        { key: "moment", label: "Best Moment", text: propString(p["Best Moment"]) },
        { key: "place", label: "Favorite Place", text: propString(p["Favorite Place"]) },
        // Notion property names can't hold an apostrophe, so "What I'd Change" is stored as "What to Change".
        { key: "change", label: "What I'd Change", text: propString(p["What to Change"]) },
      ],
      expense,
    });
  } catch (err) {
    sendError(res, err, { endpoint: "trip", databaseId: DB.trips });
  }
}
