import type { ApiRequest, ApiResponse } from "../types.js";
import { createPage, queryDatabase, uploadCoverFromUrl } from "../notion.js";
import { sendError } from "../http.js";
import { requireKey } from "../auth.js";
import { DB } from "../db.js";

// Notion caps a single rich_text object at 2000 chars — Kakao's book blurb
// is external input and occasionally runs long, which would otherwise fail
// the whole page creation over a quote block nobody asked to be truncated.
const MAX_QUOTE_LENGTH = 2000;

function heading2(text: string): Record<string, unknown> {
  return { object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: text } }] } };
}

/** Notes / Quote / Thoughts skeleton for a newly added book page (WORK-ORDER
 *  follow-up). Kakao's `contents` (book blurb), when present, goes under
 *  Notes as a quote block. */
function pageChildren(contents?: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [heading2("Notes")];
  if (contents) {
    const text = contents.slice(0, MAX_QUOTE_LENGTH);
    blocks.push({ object: "block", type: "quote", quote: { rich_text: [{ type: "text", text: { content: text } }] } });
  }
  blocks.push(heading2("Quote"), heading2("Thoughts"));
  return blocks;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!requireKey(req, res)) return;

  const body = (req.body ?? {}) as {
    title?: string;
    author?: string;
    cover?: string;
    publisher?: string;
    published?: string;
    isbn?: string;
    url?: string;
    contents?: string;
  };
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
    if (body.publisher) properties["Publisher"] = { rich_text: [{ text: { content: body.publisher } }] };
    if (body.published) properties["Published"] = { rich_text: [{ text: { content: body.published } }] };
    if (body.isbn) properties["ISBN"] = { rich_text: [{ text: { content: body.isbn } }] };
    if (body.url) properties["Link"] = { url: body.url };
    // Pages: Kakao doesn't return a page count — left unset on purpose.

    // Cover art: uploaded through the File Upload API, not linked as an
    // `external` file — some CDNs (Daum's covers among them) block Notion's
    // own image proxy, so an external reference to them never renders. A
    // failed fetch/upload only skips the cover; it must not fail the add.
    let coverUploaded = false;
    if (body.cover) {
      const fileUploadId = await uploadCoverFromUrl(body.cover);
      if (fileUploadId) {
        properties["Cover"] = { files: [{ type: "file_upload", file_upload: { id: fileUploadId } }] };
        coverUploaded = true;
      }
    }

    await createPage(DB.books, properties, pageChildren(body.contents));
    res.status(200).json({ ok: true, duplicate: existing.results.length > 0, coverUploaded });
  } catch (err) {
    sendError(res, err, { endpoint: "book-add", databaseId: DB.books });
  }
}
