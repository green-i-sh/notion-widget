import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString, propRelation, propDateStart } from "../notion.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const [projectsResult, waitingResult, somedayResult] = await Promise.all([
      queryDatabase(DB.tasks, { filter: { property: "Status", select: { equals: "Project" } }, page_size: 50 }),
      queryDatabase(DB.tasks, { filter: { property: "Status", select: { equals: "Waiting For" } }, page_size: 50 }),
      queryDatabase(DB.tasks, {
        filter: {
          or: [
            { property: "Status", select: { equals: "Someday" } },
            { property: "Status", select: { equals: "Reference" } },
          ],
        },
        page_size: 50,
      }),
    ]);

    const projects = projectsResult.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      subCount: propRelation(page.properties["Sub-tasks"]).length,
    }));

    const waiting = waitingResult.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      due: propDateStart(page.properties["Due"])?.slice(0, 10) ?? null,
    }));

    const someday = somedayResult.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      status: propString(page.properties["Status"]),
    }));

    withCache(res);
    res.status(200).json({ projects, waiting, someday });
  } catch (err) {
    sendError(res, err, { endpoint: "projects", databaseId: DB.tasks });
  }
}
