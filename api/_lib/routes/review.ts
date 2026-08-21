import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, retrievePage, propNumber, propString, propDateRange, propRelation } from "../notion.js";
import { monthOf, todayKST } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

type ReviewPage = { id: string; properties: Record<string, unknown> };
type ReviewType = "Monthly" | "Quarterly";

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
    // Board is a select — Notion validates `equals` against the option list and
    // 400s the whole request for a board that doesn't exist yet (e.g. next
    // month's), so fetch unfiltered and match in JS instead.
    queryDatabase(DB.bingo, { page_size: 100 }),
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
  const monthBingo = bingo.results.filter((p) => propString(p.properties["Board"]) === `${month} Monthly`);
  const bingoDone = monthBingo.filter((p) => {
    const done = p.properties["Done"] as { type?: string; checkbox?: boolean } | undefined;
    return done?.type === "checkbox" && done.checkbox;
  }).length;

  return [
    { key: "tasks", label: "Tasks", value: `${tasksDone} / ${tasksTotal}`, caption: "완료 / 전체" },
    { key: "tracked", label: "Tracked", value: hours(trackedMin), caption: "기록된 시간" },
    { key: "expense", label: "Expense", value: won(expense), caption: budgetTotal != null ? `예산 ${won(budgetTotal)}` : "예산 없음" },
    { key: "life", label: "Life", value: `${lifeCount}건`, caption: `Bingo ${bingoDone} / ${monthBingo.length}` },
  ];
}

/**
 * Quarterly review has Q Tasks done/Q Tasks total/Q Expense/"Q Tracked (min)"
 * as real rollups, but no Q Bingo done/total or Q Budget — those are derived
 * by following the "Monthly reviews" relation to the quarter's Monthly review
 * pages and summing their own Bingo done/Bingo total, plus that month's Budget row.
 */
async function quarterlyStats(properties: Record<string, unknown>): Promise<Stat[]> {
  const tasksDone = propNumber(properties["Q Tasks done"]);
  const tasksTotal = propNumber(properties["Q Tasks total"]);
  const trackedMin = propNumber(properties["Q Tracked (min)"]);
  const expense = propNumber(properties["Q Expense"]);

  const monthlyIds = propRelation(properties["Monthly reviews"]);
  const monthlyPages = await Promise.all(monthlyIds.map((id) => retrievePage(id)));

  let bingoDone = 0;
  let bingoTotal = 0;
  let budgetTotal = 0;
  let budgetFound = false;

  await Promise.all(
    monthlyPages.map(async (mp) => {
      bingoDone += propNumber(mp.properties["Bingo done"]);
      bingoTotal += propNumber(mp.properties["Bingo total"]);

      const range = propDateRange(mp.properties["Period"]);
      const month = range.start ? monthOf(range.start.slice(0, 10)) : null;
      if (!month) return;
      const budget = await queryDatabase(DB.budget, {
        filter: { property: "Month", rich_text: { equals: month } },
        page_size: 1,
      });
      const row = budget.results[0];
      if (row) {
        budgetTotal += propNumber(row.properties["Budget"]);
        budgetFound = true;
      }
    })
  );

  const monthCount = monthlyPages.length || 3;
  const avgHours = Math.round(trackedMin / 60 / monthCount);

  return [
    { key: "tasks", label: "Tasks", value: `${tasksDone} / ${tasksTotal}`, caption: "완료 / 전체" },
    { key: "tracked", label: "Tracked", value: hours(trackedMin), caption: `월 평균 ${avgHours}h` },
    { key: "expense", label: "Expense", value: won(expense), caption: budgetFound ? `예산 ${won(budgetTotal)}` : "예산 없음" },
    { key: "bingo", label: "Bingo", value: `${bingoDone} / ${bingoTotal}`, caption: "Quarterly board" },
  ];
}

/**
 * Picks the Review page to show. ?month=/?quarter= pin an exact one;
 * otherwise the newest Period that has already started — a future-dated
 * Period (e.g. a 2026.10 Monthly page created ahead of time) has no Daily
 * Log/Life/Bingo activity yet and would render as all zeros.
 */
async function findReviewPage(type: ReviewType, req: ApiRequest, today: string): Promise<ReviewPage | null> {
  const monthParam = typeof req.query.month === "string" ? req.query.month : undefined;
  const quarterParam = typeof req.query.quarter === "string" ? req.query.quarter : undefined;

  if (type === "Monthly" && monthParam) {
    const result = await queryDatabase(DB.review, {
      filter: { property: "Type", select: { equals: "Monthly" } },
      page_size: 100,
    });
    return (
      result.results.find((p) => {
        const range = propDateRange(p.properties["Period"]);
        return range.start ? monthOf(range.start.slice(0, 10)) === monthParam : false;
      }) ?? null
    );
  }

  if (type === "Quarterly" && quarterParam) {
    const [year, season] = quarterParam.split("-");
    const label = season ? `${year} ${season[0].toUpperCase()}${season.slice(1).toLowerCase()}` : year;
    const result = await queryDatabase(DB.review, {
      filter: {
        and: [
          { property: "Type", select: { equals: "Quarterly" } },
          { property: "Name", title: { contains: label } },
        ],
      },
      page_size: 5,
    });
    return result.results[0] ?? null;
  }

  const result = await queryDatabase(DB.review, {
    filter: { property: "Type", select: { equals: type } },
    sorts: [{ property: "Period", direction: "descending" }],
    page_size: 50,
  });
  const started = result.results.find((p) => {
    const range = propDateRange(p.properties["Period"]);
    return range.start ? range.start.slice(0, 10) <= today : false;
  });
  return started ?? null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const type: ReviewType = typeof req.query.type === "string" && req.query.type.toLowerCase() === "quarterly" ? "Quarterly" : "Monthly";

  try {
    const page = await findReviewPage(type, req, todayKST());
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
      stats = await quarterlyStats(page.properties);
    }

    withCache(res);
    res.status(200).json({ type, found: true, stats });
  } catch (err) {
    sendError(res, err, { endpoint: "review", databaseId: DB.review });
  }
}
