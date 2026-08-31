import type { ApiRequest, ApiResponse } from "./types.js";

/**
 * Shared-secret gate for write endpoints. The deployed URL alone used to be
 * enough to read AND write this Notion workspace. Reads stay open — every
 * ?w=... widget is already embedded across Notion pages without a key, and
 * requiring one there means re-editing every embed. Writes need
 * ?k=<WIDGET_KEY> or they 401.
 */
export function requireKey(req: ApiRequest, res: ApiResponse): boolean {
  const expected = process.env.WIDGET_KEY;
  const provided = typeof req.query.k === "string" ? req.query.k : undefined;
  if (!expected || !provided || provided !== expected) {
    res.status(401).json({ error: "인증 필요", message: "쓰기 요청에는 올바른 키(?k=...)가 필요합니다." });
    return false;
  }
  return true;
}
