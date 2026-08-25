import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, updatePageProperties, propCheckbox, propDateStart } from "../notion.js";
import { ensureDailyLogPage } from "../dailyLog.js";
import { mondayOf, addDays, todayKST } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

const ROUTINES = ["Exercise", "Reading", "Organizing", "Other"] as const;
type Routine = (typeof ROUTINES)[number];

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === "POST") {
    await handleToggle(req, res);
    return;
  }
  await handleWeek(req, res);
}

async function handleWeek(req: ApiRequest, res: ApiResponse) {
  const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
  const start = mondayOf(dateParam ?? todayKST());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  try {
    const result = await queryDatabase(DB.dailyLog, {
      filter: {
        and: [
          { property: "Date", date: { on_or_after: start } },
          { property: "Date", date: { on_or_before: dates[6] } },
        ],
      },
      page_size: 7,
    });

    const byDate = new Map<string, { id: string; properties: Record<string, unknown> }>();
    for (const page of result.results) {
      const date = propDateStart(page.properties["Date"]);
      if (date) byDate.set(date.slice(0, 10), page);
    }

    const days = dates.map((date) => {
      const page = byDate.get(date);
      if (!page) return { date, pageId: null, values: null };
      const values = Object.fromEntries(
        ROUTINES.map((r) => [r, propCheckbox(page.properties[r])])
      ) as Record<Routine, boolean>;
      return { date, pageId: page.id, values };
    });

    withCache(res);
    res.status(200).json({ start, end: dates[6], days });
  } catch (err) {
    sendError(res, err, { endpoint: "routine", databaseId: DB.dailyLog });
  }
}

async function handleToggle(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { date?: string; routine?: string; value?: boolean };
  const routine = body.routine as Routine;
  if (!body.date || !ROUTINES.includes(routine) || typeof body.value !== "boolean") {
    res.status(400).json({ error: "잘못된 요청입니다." });
    return;
  }
  try {
    const page = await ensureDailyLogPage(body.date);
    await updatePageProperties(page.id, { [routine]: { checkbox: body.value } });
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "routine", databaseId: DB.dailyLog, date: body.date, routine });
  }
}
