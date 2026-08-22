import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propDateStart, propFileUrl } from "../notion.js";
import { monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    // Life's Month/Date property types aren't confirmed in NOTION.md (same
    // caveat as routes/life.ts) — fetch unfiltered and match in JS.
    const result = await queryDatabase(DB.life, { page_size: 100 });

    const byDate = new Map<string, { pageId: string; photo: string | null }>();
    for (const page of result.results) {
      if (propString(page.properties["Month"]) !== month) continue;
      const date = propDateStart(page.properties["Date"])?.slice(0, 10);
      // First Life record for a day wins — Notion's own result order.
      if (!date || byDate.has(date)) continue;
      byDate.set(date, { pageId: page.id, photo: propFileUrl(page.properties["Photo"]) });
    }

    const days = [...byDate.entries()].map(([date, v]) => ({ date, ...v }));
    withCache(res);
    res.status(200).json({ month, days });
  } catch (err) {
    sendError(res, err, { endpoint: "calendar", databaseId: DB.life });
  }
}
