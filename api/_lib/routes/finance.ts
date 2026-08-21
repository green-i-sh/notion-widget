import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propNumber, propString, propDateStart } from "../notion.js";
import { computeMonthFinance } from "../finance.js";
import { monthOf, todayKST } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

/** Type = 카드/대출 rows due today or later — same "Upcoming" window the Finance page itself uses. */
async function computeCardLoan(today: string) {
  const result = await queryDatabase(DB.finance, {
    filter: {
      and: [
        { property: "Type", select: { equals: "카드/대출" } },
        { property: "Date", date: { on_or_after: today } },
      ],
    },
    sorts: [{ property: "Date", direction: "ascending" }],
    page_size: 20,
  });

  const items = result.results.map((page) => ({
    name: propString(page.properties["Name"]),
    date: propDateStart(page.properties["Date"]),
    amount: Math.abs(propNumber(page.properties["Amount"])),
  }));
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  return { total, items };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    const [fin, cardLoan] = await Promise.all([computeMonthFinance(month), computeCardLoan(todayKST())]);
    withCache(res);
    res.status(200).json({ ...fin, cardLoan });
  } catch (err) {
    sendError(res, err, { endpoint: "finance", databaseId: DB.finance });
  }
}
