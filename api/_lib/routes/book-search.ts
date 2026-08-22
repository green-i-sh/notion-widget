import type { ApiRequest, ApiResponse } from "../types.js";
import { searchNaverBooks } from "../naver.js";
import { sendError, withCache } from "../http.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "검색어가 없습니다." });
    return;
  }

  try {
    const books = await searchNaverBooks(q);
    withCache(res, 60);
    res.status(200).json({ query: q, books });
  } catch (err) {
    sendError(res, err, { endpoint: "book-search" });
  }
}
