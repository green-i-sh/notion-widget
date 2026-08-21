import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, propString, propDateRange } from "./_lib/notion.js";
import { sendError, withCache } from "./_lib/http.js";
import { DB } from "./_lib/db.js";

function formatMD(iso: string | null): string {
  const m = iso ? /^\d{4}-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${m[1]}.${m[2]}` : "";
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const [books, trips] = await Promise.all([
      queryDatabase(DB.books, { filter: { property: "Status", select: { equals: "Reading" } }, page_size: 20 }),
      queryDatabase(DB.trips, { filter: { property: "Phase", select: { equals: "Planning" } }, page_size: 20 }),
    ]);

    const rows = [
      ...books.results.map((page) => ({
        key: `book-${page.id}`,
        label: propString(page.properties["Name"]),
        value: "Reading",
      })),
      ...trips.results.map((page) => {
        const range = propDateRange(page.properties["Date"]);
        return { key: `trip-${page.id}`, label: propString(page.properties["Name"]), value: `${formatMD(range.start)} —` };
      }),
    ];

    withCache(res);
    res.status(200).json({ rows });
  } catch (err) {
    sendError(res, err, { endpoint: "shelf", databaseId: DB.books });
  }
}
