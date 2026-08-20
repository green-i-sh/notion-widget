import type { ApiResponse } from "./types.js";
import { TokenMissingError, NotionApiError } from "./notion.js";

/**
 * Notion's rate limit is ~3 req/s and every open widget queries on its own,
 * so GET responses get a short CDN cache. 30s default, matching WIDGET-SPEC.md.
 */
export function withCache(res: ApiResponse, seconds = 30): void {
  res.setHeader("Cache-Control", `s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`);
}

/**
 * Logs the real error to the Vercel function log and sends it to the client
 * as-is — no swallowing into a generic "요청 실패". `context` carries which
 * DB/page/endpoint was involved so the failure is traceable from the response alone.
 */
export function sendError(res: ApiResponse, err: unknown, context: Record<string, unknown> = {}): void {
  console.error("[api]", context, err);

  if (err instanceof TokenMissingError) {
    res.status(500).json({ error: "토큰 미설정", message: err.message, ...context });
    return;
  }
  if (err instanceof NotionApiError) {
    res.status(err.status).json({
      error: "Notion API 오류",
      message: err.message,
      status: err.status,
      notionCode: err.notionCode,
      ...context,
    });
    return;
  }
  res.status(500).json({
    error: "서버 오류",
    message: err instanceof Error ? err.message : String(err),
    ...context,
  });
}
