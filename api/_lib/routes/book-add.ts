import type { ApiRequest, ApiResponse } from "../types.js";
import { createPage, queryDatabase } from "../notion.js";
import { sendError } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { title?: string; author?: string; cover?: string; publisher?: string };
  const title = body.title?.trim();
  if (!title) {
    res.status(400).json({ error: "제목이 없습니다." });
    return;
  }

  try {
    const existing = await queryDatabase(DB.books, {
      filter: { property: "Name", title: { equals: title } },
      page_size: 1,
    });

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: title } }] },
      Status: { select: { name: "To Read" } },
    };
    if (body.author) properties["Author"] = { rich_text: [{ text: { content: body.author } }] };
    if (body.cover) properties["Cover"] = { files: [{ type: "external", name: title, external: { url: body.cover } }] };

    await createPage(DB.books, properties);
    res.status(200).json({ ok: true, duplicate: existing.results.length > 0 });
  } catch (err) {
    sendError(res, err, { endpoint: "book-add", databaseId: DB.books });
  }
}
