import type { ApiRequest, ApiResponse } from "../types.js";
import { updatePageProperties } from "../notion.js";
import { fetchBingoRows, latestBoard } from "../bingo.js";
import { sendError } from "../http.js";
import { requireKey } from "../auth.js";
import { assertParentDb } from "../guard.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === "POST") {
    if (!requireKey(req, res)) return;
    await handleToggle(req, res);
    return;
  }
  await handleBoard(req, res);
}

async function handleBoard(req: ApiRequest, res: ApiResponse) {
  const boardParam = typeof req.query.board === "string" ? req.query.board : "monthly";
  const label = boardParam.toLowerCase() === "quarterly" ? "Quarterly" : "Monthly";

  try {
    const rows = await fetchBingoRows();
    const { board, items } = latestBoard(rows, label);

    // No withCache here — unlike the read-only widgets, this board is toggled
    // in place, so a CDN cache would show a stale pre-toggle state to the
    // next page load for up to its TTL.
    res.status(200).json({ board, items, done: items.filter((i) => i.done).length, total: items.length });
  } catch (err) {
    sendError(res, err, { endpoint: "bingo", databaseId: DB.bingo });
  }
}

async function handleToggle(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { pageId?: string; value?: boolean };
  if (!body.pageId || typeof body.value !== "boolean") {
    res.status(400).json({ error: "잘못된 요청입니다." });
    return;
  }
  try {
    if (!(await assertParentDb(body.pageId, DB.bingo, res))) return;
    await updatePageProperties(body.pageId, { Done: { checkbox: body.value } });
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "bingo", databaseId: DB.bingo, pageId: body.pageId });
  }
}
