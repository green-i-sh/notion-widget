import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import { queryDatabase, propString, propMultiSelect } from "./_lib/notion.js";
import { monthOf } from "./_lib/date.js";
import { sendError, withCache } from "./_lib/http.js";
import { DB } from "./_lib/db.js";

/** Life's `Group` multi-select collapses onto 4 display buckets — 전시/취미 share one column in the mockup. */
const BUCKETS = [
  { key: "place", label: "장소", tags: ["장소"] },
  { key: "culture", label: "전시 / 취미", tags: ["전시", "취미"] },
  { key: "people", label: "사람", tags: ["사람"] },
  { key: "new", label: "새로운 경험", tags: ["새로운 경험"] },
] as const;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const month = typeof req.query.month === "string" ? req.query.month : monthOf();

  try {
    const result = await queryDatabase(DB.life, {
      filter: { property: "Month", formula: { string: { equals: month } } },
      page_size: 100,
    });

    const rows = result.results.map((page) => ({
      name: propString(page.properties["Name"]),
      groups: propMultiSelect(page.properties["Group"]),
    }));

    const stats = BUCKETS.map((b) => {
      const matches = rows.filter((r) => r.groups.some((g) => (b.tags as readonly string[]).includes(g)));
      return { key: b.key, label: b.label, count: matches.length, names: matches.map((r) => r.name) };
    });

    withCache(res);
    res.status(200).json({ month, stats });
  } catch (err) {
    sendError(res, err, { endpoint: "life", databaseId: DB.life });
  }
}
