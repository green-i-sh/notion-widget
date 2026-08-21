import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propNumber, propString } from "../notion.js";
import { monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    // Streak's schema isn't documented anywhere (NOTION.md has no section for
    // it) — no filter/sort here, just read the one row and fall back gracefully.
    const result = await queryDatabase(DB.streak, { page_size: 1 });
    const page = result.results[0];

    const month = page ? propString(page.properties["Month"]) || monthOf() : monthOf();
    const streakDays = page ? propNumber(page.properties["연속 기록"]) : 0;

    withCache(res);
    res.status(200).json({ month, streakDays });
  } catch (err) {
    sendError(res, err, { endpoint: "streak", databaseId: DB.streak });
  }
}
