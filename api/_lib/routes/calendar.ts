import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propDateStart, propFileUrl } from "../notion.js";
import { monthOf, monthDateRange } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();
  const { start, end } = monthDateRange(month);

  try {
    const result = await queryDatabase(DB.dailyLog, {
      filter: {
        and: [
          { property: "Date", date: { on_or_after: start } },
          { property: "Date", date: { on_or_before: end } },
        ],
      },
      page_size: 31,
    });

    const days = result.results
      .map((page) => {
        const date = propDateStart(page.properties["Date"])?.slice(0, 10);
        return date ? { date, pageId: page.id, photo: propFileUrl(page.properties["Photo"]) } : null;
      })
      .filter((d): d is { date: string; pageId: string; photo: string | null } => Boolean(d));

    withCache(res);
    res.status(200).json({ month, days });
  } catch (err) {
    sendError(res, err, { endpoint: "calendar", databaseId: DB.dailyLog });
  }
}
