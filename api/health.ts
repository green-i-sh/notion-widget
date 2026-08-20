import type { ApiRequest, ApiResponse } from "./_lib/types";
import { queryDatabase, NotionApiError } from "./_lib/notion";

const DAILY_LOG_DB = "3c91cb4b5255486c98c6128f44650848";

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const token = process.env.NOTION_TOKEN;
  const tokenPresent = Boolean(token);
  const tokenPreview = token ? token.slice(0, 4) : null;

  if (!tokenPresent) {
    res.status(200).json({
      tokenPresent: false,
      tokenPreview: null,
      dailyLogDb: DAILY_LOG_DB,
      dbAccess: { ok: false, message: "NOTION_TOKEN이 설정되지 않았습니다." },
      rowCount: 0,
    });
    return;
  }

  try {
    const result = await queryDatabase(DAILY_LOG_DB, {});
    res.status(200).json({
      tokenPresent: true,
      tokenPreview,
      dailyLogDb: DAILY_LOG_DB,
      dbAccess: { ok: true, message: "OK" },
      rowCount: result.results.length,
    });
  } catch (err) {
    console.error("[api/health]", { databaseId: DAILY_LOG_DB }, err);
    res.status(200).json({
      tokenPresent: true,
      tokenPreview,
      dailyLogDb: DAILY_LOG_DB,
      dbAccess: {
        ok: false,
        status: err instanceof NotionApiError ? err.status : undefined,
        message: err instanceof Error ? err.message : String(err),
      },
      rowCount: 0,
    });
  }
}
