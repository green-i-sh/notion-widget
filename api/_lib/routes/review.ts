import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, retrievePage, propNumber, propNumberOrNull, propDateRange, propRelation } from "../notion.js";
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

const DASH = "—";

function won(n: number): string {
  return `₩${Math.round(Math.abs(n)).toLocaleString()}`;
}

function hours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Monthly Review pages already carry these as real number properties
 * (WORK-ORDER.md #2) — reading them directly keeps this in sync with
 * whatever the Notion page itself shows, instead of re-aggregating Daily
 * Log/Life/Bingo here (which drifted from the mockup whenever a day's
 * logging was thin). A property left empty in Notion renders as "—".
 */
function monthlyStats(properties: Record<string, unknown>): Stat[] {
  const tasksDone = propNumberOrNull(properties["Tasks done"]);
  const tasksTotal = propNumberOrNull(properties["Tasks total"]);
  const trackedMin = propNumberOrNull(properties["Tracked (min)"]);
  const expense = propNumberOrNull(properties["Expense"]);
  const lifeCount = propNumberOrNull(properties["Life 건수"]);
  const bingoDone = propNumberOrNull(properties["Bingo done"]);
  const bingoTotal = propNumberOrNull(properties["Bingo total"]);

  return [
    {
      key: "tasks",
      label: "Tasks",
      value: tasksDone != null && tasksTotal != null ? `${tasksDone} / ${tasksTotal}` : DASH,
      caption: "완료 / 전체",
    },
    {
      key: "tracked",
      label: "Tracked",
      value: trackedMin != null ? hours(trackedMin) : DASH,
      caption: "기록된 시간",
    },
    {
      key: "expense",
      label: "Expense",
      value: expense != null ? won(expense) : DASH,
      caption: "이번 달 지출",
    },
    {
      key: "life",
      label: "Life",
      value: lifeCount != null ? `${lifeCount}건` : DASH,
      caption: bingoDone != null && bingoTotal != null ? `Bingo ${bingoDone} / ${bingoTotal}` : "Bingo —",
    },
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

  // Quarterly pages are made ahead of the quarter on purpose (WIDGET-SPEC.md's
  // own "2026 Fall" example starts 09.01, weeks before it's created) — only
  // Monthly needs the future-Period guard, for the case that actually broke
  // (a 2026.10 Monthly created early, with no activity yet, winning "latest").
  if (type === "Quarterly") {
    return result.results[0] ?? null;
  }

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

    const stats = type === "Monthly" ? monthlyStats(page.properties) : await quarterlyStats(page.properties);

    withCache(res);
    res.status(200).json({ type, found: true, stats });
  } catch (err) {
    sendError(res, err, { endpoint: "review", databaseId: DB.review });
  }
}
