import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propNumber, propDateRange, propFileUrls } from "../notion.js";
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

const MAX_PHOTOS = 4;

/** Up to MAX_PHOTOS items, randomly picked when there are more than that
 *  (Fisher-Yates, partial); all of them, in order, otherwise. */
function pickPhotos(urls: string[]): string[] {
  if (urls.length <= MAX_PHOTOS) return urls;
  const pool = [...urls];
  for (let i = pool.length - 1; i > pool.length - 1 - MAX_PHOTOS; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(pool.length - MAX_PHOTOS);
}

/** No `?trip=` given: prefer the nearest upcoming Planning trip; if none is
 *  planned, fall back to the most recently completed (After Trip) one. */
async function pickDefaultTrip(): Promise<{ id: string; properties: Record<string, unknown> } | undefined> {
  const planning = await queryDatabase(DB.trips, {
    filter: { property: "Phase", select: { equals: "Planning" } },
    sorts: [{ property: "Date", direction: "ascending" }],
    page_size: 1,
  });
  if (planning.results[0]) return planning.results[0];

  const past = await queryDatabase(DB.trips, {
    filter: { property: "Phase", select: { equals: "After Trip" } },
    sorts: [{ property: "Date", direction: "descending" }],
    page_size: 1,
  });
  return past.results[0];
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const tripName = typeof req.query.trip === "string" ? req.query.trip : undefined;

  try {
    const page = tripName
      ? (
          await queryDatabase(DB.trips, {
            filter: { property: "Name", title: { equals: tripName } },
            page_size: 1,
          })
        ).results[0]
      : await pickDefaultTrip();

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
      photos: pickPhotos(propFileUrls(p["Cover"])),
      start,
      end,
      people: propString(p["People"]) || null,
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
