import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, NotionApiError } from "./_lib/notion.js";
import { DB } from "./_lib/db.js";

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const token = process.env.NOTION_TOKEN;
  const tokenPresent = Boolean(token);
  const tokenPreview = token ? token.slice(0, 4) : null;

  if (!tokenPresent) {
    res.status(200).json({
      tokenPresent: false,
      tokenPreview: null,
      dailyLogDb: DB.dailyLog,
      dbAccess: { ok: false, message: "NOTION_TOKEN이 설정되지 않았습니다." },
      rowCount: 0,
    });
    return;
  }

  try {
    const result = await queryDatabase(DB.dailyLog, {});
    res.status(200).json({
      tokenPresent: true,
      tokenPreview,
      dailyLogDb: DB.dailyLog,
      dbAccess: { ok: true, message: "OK" },
      rowCount: result.results.length,
    });
  } catch (err) {
    console.error("[api/health]", { databaseId: DB.dailyLog }, err);
    res.status(200).json({
      tokenPresent: true,
      tokenPreview,
      dailyLogDb: DB.dailyLog,
      dbAccess: {
        ok: false,
        status: err instanceof NotionApiError ? err.status : undefined,
        message: err instanceof Error ? err.message : String(err),
      },
      rowCount: 0,
    });
  }
}
