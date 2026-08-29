import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propMultiSelect, propNumber, propDateStart } from "../notion.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const result = await queryDatabase(DB.tasks, {
      filter: { property: "Status", select: { equals: "Next Action" } },
      page_size: 100,
    });

    const tasks = result.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      priority: propString(page.properties["Priority"]),
      context: propMultiSelect(page.properties["Context"]),
      due: propDateStart(page.properties["Due"])?.slice(0, 10) ?? null,
      trackedMin: propNumber(page.properties["Tracked"]),
    }));

    withCache(res);
    res.status(200).json({ tasks });
  } catch (err) {
    sendError(res, err, { endpoint: "next", databaseId: DB.tasks });
  }
}
