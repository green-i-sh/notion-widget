import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propNumber, propString } from "../notion.js";
import { todayKST, monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";
import { fetchBingoRows, latestBoard } from "../bingo.js";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function weekdayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAYS_EN[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

async function today(req: ApiRequest): Promise<string> {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();
  return `${date.replace(/-/g, ".")} ${weekdayOf(date)}`;
}

async function finance(req: ApiRequest): Promise<string> {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();
  const result = await queryDatabase(DB.budget, {
    filter: { property: "Month", rich_text: { equals: month } },
    page_size: 1,
  });
  const budget = result.results[0] ? propNumber(result.results[0].properties["Budget"]) : null;
  const budgetText = budget != null ? `₩${Math.round(budget).toLocaleString()}` : "—";
  return `Month ${month}   Budget ${budgetText}`;
}

async function life(req: ApiRequest): Promise<string> {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();
  // Life's Month property type isn't confirmed (see routes/life.ts) — fetch and match in JS.
  const result = await queryDatabase(DB.life, { page_size: 100 });
  const count = result.results.filter((p) => propString(p.properties["Month"]) === month).length;
  return `Month ${month}   기록 ${count}건`;
}

async function books(): Promise<string> {
  const result = await queryDatabase(DB.books, { page_size: 100 });
  const counts: Record<string, number> = { Reading: 0, "To Read": 0, Done: 0 };
  for (const page of result.results) {
    const status = propString(page.properties["Status"]);
    if (status in counts) counts[status] += 1;
  }
  return `Reading ${counts["Reading"]} · To Read ${counts["To Read"]} · Done ${counts["Done"]}`;
}

async function bingo(): Promise<string> {
  const rows = await fetchBingoRows();
  const { board, items } = latestBoard(rows, "Monthly");
  const done = items.filter((i) => i.done).length;
  return `Board ${board || "—"}   Done ${done} / ${items.length}`;
}

const KINDS: Record<string, (req: ApiRequest) => Promise<string>> = { today, finance, life, books, bingo };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const kind = typeof req.query.kind === "string" ? req.query.kind : "today";
  const build = KINDS[kind];
  if (!build) {
    res.status(400).json({ error: "알 수 없는 kind입니다.", kind, availableKinds: Object.keys(KINDS) });
    return;
  }

  try {
    const text = await build(req);
    withCache(res);
    res.status(200).json({ kind, text });
  } catch (err) {
    sendError(res, err, { endpoint: "meta", kind });
  }
}
