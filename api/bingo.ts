import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, updatePageProperties, propNumber, propString, propCheckbox } from "./_lib/notion.js";
import { sendError, withCache } from "./_lib/http.js";
import { DB } from "./_lib/db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === "POST") {
    await handleToggle(req, res);
    return;
  }
  await handleBoard(req, res);
}

async function handleBoard(req: ApiRequest, res: ApiResponse) {
  const boardParam = typeof req.query.board === "string" ? req.query.board : "monthly";
  const label = boardParam.toLowerCase() === "quarterly" ? "Quarterly" : "Monthly";

  try {
    const result = await queryDatabase(DB.bingo, {
      sorts: [{ property: "No", direction: "ascending" }],
      page_size: 100,
    });

    const rows = result.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      board: propString(page.properties["Board"]),
      no: propNumber(page.properties["No"]),
      done: propCheckbox(page.properties["Done"]),
    }));

    // Multiple boards of the same kind can pile up over time (a new "2026.09
    // Monthly" each month) — take the most recent one, not every match.
    const matching = rows.filter((r) => r.board.includes(label));
    const board = matching.reduce((max, r) => (r.board > max ? r.board : max), "");
    const items = matching.filter((r) => r.board === board).sort((a, b) => a.no - b.no);

    withCache(res);
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
    await updatePageProperties(body.pageId, { Done: { checkbox: body.value } });
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "bingo", databaseId: DB.bingo, pageId: body.pageId });
  }
}
