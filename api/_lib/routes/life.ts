import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propMultiSelect } from "../notion.js";
import { monthOf } from "../date.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    // Month's exact property type isn't documented in NOTION.md (unlike Finance/Budget) —
    // filtering server-side risks a 400 if the guess is wrong, so fetch and match in JS instead.
    const result = await queryDatabase(DB.life, { page_size: 100 });

    const rows = result.results
      .map((page) => ({
        name: propString(page.properties["Name"]),
        month: propString(page.properties["Month"]),
        groups: propMultiSelect(page.properties["Group"]),
      }))
      .filter((r) => r.month === month);

    // Group's option strings ("장소", "전시 / 취미", ...) live in Notion, not
    // here — bucket by whatever tag values actually show up this month.
    const buckets = new Map<string, string[]>();
    for (const row of rows) {
      for (const g of row.groups) {
        if (!buckets.has(g)) buckets.set(g, []);
        buckets.get(g)!.push(row.name);
      }
    }

    const stats = [...buckets.entries()].map(([label, names]) => ({
      key: label,
      label,
      count: names.length,
      names,
    }));

    withCache(res);
    res.status(200).json({ month, stats });
  } catch (err) {
    sendError(res, err, { endpoint: "life", databaseId: DB.life });
  }
}
