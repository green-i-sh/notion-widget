import type { ApiRequest, ApiResponse } from "./_lib/types";
import { queryDatabase, updatePageProperties, propCheckbox, propDateStart } from "./_lib/notion";
import { mondayOf, addDays, todayKST } from "./_lib/date";
import { sendError } from "./_lib/http";

const DAILY_LOG_DB = "3c91cb4b5255486c98c6128f44650848";
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
  const startParam = typeof req.query.start === "string" ? req.query.start : undefined;
  const start = mondayOf(startParam ?? todayKST());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  try {
    const result = await queryDatabase(DAILY_LOG_DB, {
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

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({ start, end: dates[6], days });
  } catch (err) {
    sendError(res, err, { endpoint: "routine", databaseId: DAILY_LOG_DB });
  }
}

async function handleToggle(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { pageId?: string; routine?: string; value?: boolean };
  const routine = body.routine as Routine;
  if (!body.pageId || !ROUTINES.includes(routine) || typeof body.value !== "boolean") {
    res.status(400).json({ error: "잘못된 요청입니다." });
    return;
  }
  try {
    await updatePageProperties(body.pageId, { [routine]: { checkbox: body.value } });
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "routine", databaseId: DAILY_LOG_DB, pageId: body.pageId, routine });
  }
}
