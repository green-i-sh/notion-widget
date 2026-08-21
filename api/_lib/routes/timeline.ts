import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propNumber, propString, propDateStart } from "../notion.js";
import { todayKST, addDays } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();
  const startISO = `${date}T00:00:00+09:00`;
  const endISO = `${addDays(date, 1)}T00:00:00+09:00`;

  try {
    const result = await queryDatabase(DB.timeLog, {
      filter: {
        and: [
          { property: "Start", date: { on_or_after: startISO } },
          { property: "Start", date: { before: endISO } },
        ],
      },
      sorts: [{ property: "Start", direction: "ascending" }],
      page_size: 50,
    });

    let totalMin = 0;
    const entries = result.results.map((page) => {
      const props = page.properties;
      const durationMin = propNumber(props["Duration (min)"]);
      totalMin += durationMin;
      return {
        id: page.id,
        title: propString(props["Name"]),
        start: propDateStart(props["Start"]),
        end: propDateStart(props["End"]),
        durationMin,
        note: propString(props["What I did"]),
      };
    });

    withCache(res);
    res.status(200).json({ date, totalMin, entries });
  } catch (err) {
    sendError(res, err, { endpoint: "timeline", databaseId: DB.timeLog });
  }
}
