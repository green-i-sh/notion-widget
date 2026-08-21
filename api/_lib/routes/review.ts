import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propNumber, propString, propDateRange } from "../notion.js";
import { monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

interface Stat {
  key: string;
  label: string;
  value: string;
  caption: string;
}

function won(n: number): string {
  return `₩${Math.round(Math.abs(n)).toLocaleString()}`;
}

function hours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Monthly review has no rollups on the page itself (WIDGET-SPEC.md: the numbers
 *  are a Notion "Calculate" footer, which the API can't read) — aggregate
 *  Daily Log/Life/Bingo across the review's Period ourselves instead. */
async function monthlyStats(start: string, end: string): Promise<Stat[]> {
  const month = monthOf(start);

  const [daily, life, budget, bingo] = await Promise.all([
    queryDatabase(DB.dailyLog, {
      filter: {
        and: [
          { property: "Date", date: { on_or_after: start } },
          { property: "Date", date: { on_or_before: end } },
        ],
      },
      page_size: 100,
    }),
    // Life's Month property type isn't confirmed (see routes/life.ts) — fetch and match in JS.
    queryDatabase(DB.life, { page_size: 100 }),
    queryDatabase(DB.budget, {
      filter: { property: "Month", rich_text: { equals: month } },
      page_size: 1,
    }),
    queryDatabase(DB.bingo, {
      filter: { property: "Board", select: { equals: `${month} Monthly` } },
      page_size: 100,
    }),
  ]);

  let tasksDone = 0;
  let tasksTotal = 0;
  let trackedMin = 0;
  let expense = 0;
  for (const page of daily.results) {
    const p = page.properties;
    tasksDone += propNumber(p["Tasks done"]);
    tasksTotal += propNumber(p["Tasks total"]);
    trackedMin += propNumber(p["Tracked"]);
    expense += Math.abs(propNumber(p["Expense"]));
  }

  const lifeCount = life.results.filter((p) => propString(p.properties["Month"]) === month).length;
  const budgetTotal = budget.results[0] ? propNumber(budget.results[0].properties["Budget"]) : null;
  const bingoDone = bingo.results.filter((p) => {
    const done = p.properties["Done"] as { type?: string; checkbox?: boolean } | undefined;
    return done?.type === "checkbox" && done.checkbox;
  }).length;

  return [
    { key: "tasks", label: "Tasks", value: `${tasksDone} / ${tasksTotal}`, caption: "완료 / 전체" },
    { key: "tracked", label: "Tracked", value: hours(trackedMin), caption: "기록된 시간" },
    { key: "expense", label: "Expense", value: won(expense), caption: budgetTotal != null ? `예산 ${won(budgetTotal)}` : "예산 없음" },
    { key: "life", label: "Life", value: `${lifeCount}건`, caption: `Bingo ${bingoDone} / ${bingo.results.length}` },
  ];
}

/** Quarterly review does have rollups (WIDGET-SPEC.md §9: "Q Tasks done" 등) — read straight off the page. */
function quarterlyStats(properties: Record<string, unknown>): Stat[] {
  const tasksDone = propNumber(properties["Q Tasks done"]);
  const tasksTotal = propNumber(properties["Q Tasks total"]);
  const trackedMin = propNumber(properties["Q Tracked"]);
  const expense = propNumber(properties["Q Expense"]);
  const budget = propNumber(properties["Q Budget"]);
  const bingoDone = propNumber(properties["Q Bingo done"]);
  const bingoTotal = propNumber(properties["Q Bingo total"]);
  const avgHours = Math.round(trackedMin / 60 / 3);

  return [
    { key: "tasks", label: "Tasks", value: `${tasksDone} / ${tasksTotal}`, caption: "완료 / 전체" },
    { key: "tracked", label: "Tracked", value: hours(trackedMin), caption: `월 평균 ${avgHours}h` },
    { key: "expense", label: "Expense", value: won(expense), caption: budget ? `예산 ${won(budget)}` : "예산 없음" },
    { key: "bingo", label: "Bingo", value: `${bingoDone} / ${bingoTotal}`, caption: "Quarterly board" },
  ];
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const type = typeof req.query.type === "string" && req.query.type.toLowerCase() === "quarterly" ? "Quarterly" : "Monthly";

  try {
    const result = await queryDatabase(DB.review, {
      filter: { property: "Type", select: { equals: type } },
      sorts: [{ property: "Period", direction: "descending" }],
      page_size: 1,
    });
    const page = result.results[0];
    if (!page) {
      res.status(200).json({ type, found: false, stats: [] });
      return;
    }

    let stats: Stat[];
    if (type === "Monthly") {
      const range = propDateRange(page.properties["Period"]);
      const start = range.start?.slice(0, 10);
      const end = (range.end ?? range.start)?.slice(0, 10);
      if (!start || !end) throw new Error("Review 페이지에 Period 날짜가 없습니다.");
      stats = await monthlyStats(start, end);
    } else {
      stats = quarterlyStats(page.properties);
    }

    withCache(res);
    res.status(200).json({ type, found: true, stats });
  } catch (err) {
    sendError(res, err, { endpoint: "review", databaseId: DB.review });
  }
}
