import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, propNumber, propString } from "./_lib/notion.js";
import { todayKST } from "./_lib/date.js";
import { sendError, withCache } from "./_lib/http.js";
import { DB } from "./_lib/db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();

  try {
    const result = await queryDatabase(DB.dailyLog, {
      filter: { property: "Date", date: { equals: date } },
      page_size: 1,
    });
    const page = result.results[0];
    if (!page) {
      res.status(200).json({ date, found: false });
      return;
    }

    const props = page.properties;
    withCache(res);
    res.status(200).json({
      date,
      found: true,
      tasksDone: propNumber(props["Tasks done"]),
      tasksTotal: propNumber(props["Tasks total"]),
      trackedMin: propNumber(props["Tracked"]),
      expense: propNumber(props["Expense"]),
      morningPage: propString(props["Morning Page"]),
    });
  } catch (err) {
    sendError(res, err, { endpoint: "today", databaseId: DB.dailyLog });
  }
}
