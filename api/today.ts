import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, propNumber, propString } from "./_lib/notion.js";
import { todayKST } from "./_lib/date.js";
import { sendError } from "./_lib/http.js";

const DAILY_LOG_DB = "3c91cb4b5255486c98c6128f44650848";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();

  try {
    const result = await queryDatabase(DAILY_LOG_DB, {
      filter: { property: "Date", date: { equals: date } },
      page_size: 1,
    });
    const page = result.results[0];
    if (!page) {
      res.status(200).json({ date, found: false });
      return;
    }

    const props = page.properties;
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
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
    sendError(res, err, { endpoint: "today", databaseId: DAILY_LOG_DB });
  }
}
