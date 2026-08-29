import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propMultiSelect } from "../notion.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const result = await queryDatabase(DB.tasks, {
      filter: { property: "Status", select: { equals: "Inbox" } },
      sorts: [{ property: "Captured", direction: "ascending" }],
      page_size: 100,
    });

    const tasks = result.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      status: propString(page.properties["Status"]),
      priority: propString(page.properties["Priority"]),
      context: propMultiSelect(page.properties["Context"]),
      when: propString(page.properties["When"]),
    }));

    withCache(res);
    res.status(200).json({ tasks });
  } catch (err) {
    sendError(res, err, { endpoint: "inbox", databaseId: DB.tasks });
  }
}
