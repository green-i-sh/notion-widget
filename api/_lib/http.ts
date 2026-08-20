import type { ApiResponse } from "./types";
import { TokenMissingError, NotionApiError } from "./notion";

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
