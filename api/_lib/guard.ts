import type { ApiResponse } from "./types.js";
import { retrievePage } from "./notion.js";

function normalize(id: string): string {
  return id.replace(/-/g, "");
}

/**
 * True (and safe to write) only if `pageId`'s parent database is
 * `expectedDbId` — sends 403 and returns false otherwise. A write route that
 * takes a client-supplied pageId must call this before updatePageProperties,
 * so a request can't point that id at a page outside the DB the route owns.
 */
export async function assertParentDb(pageId: string, expectedDbId: string, res: ApiResponse): Promise<boolean> {
  const page = await retrievePage(pageId);
  const parentDbId = page.parent?.database_id;
  if (!parentDbId || normalize(parentDbId) !== normalize(expectedDbId)) {
    res.status(403).json({ error: "잘못된 페이지입니다.", message: "이 페이지는 이 API가 다루는 DB 소속이 아닙니다." });
    return false;
  }
  return true;
}
