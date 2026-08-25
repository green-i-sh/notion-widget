import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propDateStart, propFileUrl } from "../notion.js";
import { monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

/** Start/end YYYY-MM-DD for a "YYYY.MM" month — day 0 of the next JS month
 *  rolls back to the last day of this one, so no separate leap-year math. */
function monthDateRange(month: string): { start: string; end: string } {
  const [y, m] = month.split(".").map(Number);
  const start = `${month.replace(".", "-")}-01`;
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { start, end };
}

/** Daily Log has no Month formula (only Date), so filter by range directly
 *  instead of fetching unfiltered like Life below. */
async function fetchDailyLogPageIds(month: string): Promise<Map<string, string>> {
  const { start, end } = monthDateRange(month);
  const result = await queryDatabase(DB.dailyLog, {
    filter: {
      and: [
        { property: "Date", date: { on_or_after: start } },
        { property: "Date", date: { on_or_before: end } },
      ],
    },
    page_size: 31,
  });
  const map = new Map<string, string>();
  for (const page of result.results) {
    const date = propDateStart(page.properties["Date"])?.slice(0, 10);
    if (date) map.set(date, page.id);
  }
  return map;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    // Life's Month/Date property types aren't confirmed in NOTION.md (same
    // caveat as routes/life.ts) — fetch unfiltered and match in JS.
    const [lifeResult, dailyLogIds] = await Promise.all([
      queryDatabase(DB.life, { page_size: 100 }),
      fetchDailyLogPageIds(month),
    ]);

    const photoByDate = new Map<string, string | null>();
    for (const page of lifeResult.results) {
      if (propString(page.properties["Month"]) !== month) continue;
      const date = propDateStart(page.properties["Date"])?.slice(0, 10);
      // First Life record for a day wins — Notion's own result order.
      if (!date || photoByDate.has(date)) continue;
      photoByDate.set(date, propFileUrl(page.properties["Photo"]));
    }

    const dates = new Set([...photoByDate.keys(), ...dailyLogIds.keys()]);
    const days = [...dates].map((date) => ({
      date,
      pageId: dailyLogIds.get(date) ?? null,
      photo: photoByDate.get(date) ?? null,
    }));

    withCache(res);
    res.status(200).json({ month, days });
  } catch (err) {
    sendError(res, err, { endpoint: "calendar", databaseId: DB.life });
  }
}
