import type { ApiRequest, ApiResponse } from "../types.js";
import { computeMonthFinance } from "../finance.js";
import { monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

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
