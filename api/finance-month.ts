import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { computeMonthFinance } from "./_lib/finance.js";
import { monthOf } from "./_lib/date.js";
import { sendError, withCache } from "./_lib/http.js";
import { DB } from "./_lib/db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    const fin = await computeMonthFinance(month);
    withCache(res);
    res.status(200).json(fin);
  } catch (err) {
    sendError(res, err, { endpoint: "finance-month", databaseId: DB.finance });
  }
}
