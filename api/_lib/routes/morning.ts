import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, updatePageProperties, propString, richTextProperty } from "../notion.js";
import { todayKST } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

/** Only these two fields are writable from the client — the property name
 *  itself never comes from the request body, so a bad `field` value can't
 *  be used to write an arbitrary Daily Log property. */
const FIELD_PROPERTY = {
  morning: "Morning Page 본문",
  log: "Log",
} as const;
type Field = keyof typeof FIELD_PROPERTY;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === "POST") {
    await handleWrite(req, res);
    return;
  }
  await handleRead(req, res);
}

async function handleRead(req: ApiRequest, res: ApiResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();

  try {
    const result = await queryDatabase(DB.dailyLog, {
      filter: { property: "Date", date: { equals: date } },
      page_size: 1,
    });
    const page = result.results[0];
    if (!page) {
      res.status(200).json({ date, found: false, morning: "", log: "" });
      return;
    }

    const p = page.properties;
    withCache(res, 5);
    res.status(200).json({
      date,
      found: true,
      morning: propString(p["Morning Page 본문"]),
      log: propString(p["Log"]),
    });
  } catch (err) {
    sendError(res, err, { endpoint: "morning", databaseId: DB.dailyLog, date });
  }
}

async function handleWrite(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { date?: string; field?: string; value?: string };
  const field = body.field as Field;
  if (!body.date || !(field in FIELD_PROPERTY) || typeof body.value !== "string") {
    res.status(400).json({ error: "잘못된 요청입니다." });
    return;
  }

  try {
    const result = await queryDatabase(DB.dailyLog, {
      filter: { property: "Date", date: { equals: body.date } },
      page_size: 1,
    });
    const page = result.results[0];
    if (!page) {
      res.status(404).json({ error: "해당 날짜의 Daily Log가 없습니다.", date: body.date });
      return;
    }

    const properties: Record<string, unknown> = { [FIELD_PROPERTY[field]]: richTextProperty(body.value) };
    if (field === "morning") {
      properties["Morning Page"] = { select: { name: body.value.trim() ? "작성" : "미작성" } };
    }

    await updatePageProperties(page.id, properties);
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "morning", databaseId: DB.dailyLog, date: body.date, field });
  }
}
