import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propDateStart } from "../notion.js";
import { monthOf, monthDateRange } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();
  const { start, end } = monthDateRange(month);

  try {
    const result = await queryDatabase(DB.tasks, {
      filter: {
        and: [
          { property: "Due", date: { on_or_after: start } },
          { property: "Due", date: { on_or_before: end } },
        ],
      },
      page_size: 100,
    });

    const byDate = new Map<string, { id: string; name: string; priority: string }[]>();
    for (const page of result.results) {
      const date = propDateStart(page.properties["Due"])?.slice(0, 10);
      if (!date) continue;
      const entry = { id: page.id, name: propString(page.properties["Name"]), priority: propString(page.properties["Priority"]) };
      const list = byDate.get(date);
      if (list) list.push(entry);
      else byDate.set(date, [entry]);
    }

    const days = [...byDate.entries()].map(([date, tasks]) => ({ date, tasks }));

    withCache(res);
    res.status(200).json({ month, days });
  } catch (err) {
    sendError(res, err, { endpoint: "taskcal", databaseId: DB.tasks });
  }
}
