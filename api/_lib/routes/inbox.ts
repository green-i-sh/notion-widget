import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, updatePageProperties, propString, propMultiSelect, propDateStart } from "../notion.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

async function handleGet(res: ApiResponse) {
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
    due: propDateStart(page.properties["Due"]),
  }));

  withCache(res);
  res.status(200).json({ tasks });
}

interface InboxPatch {
  priority?: string;
  context?: string[];
  when?: string;
  due?: string | null;
  status?: string;
}

/** Only these five keys are ever read off `patch` — anything else in the
 *  request body is silently ignored, which is the whitelist. */
function propertiesFromPatch(patch: InboxPatch): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  if ("priority" in patch) properties["Priority"] = { select: patch.priority ? { name: patch.priority } : null };
  if ("context" in patch) properties["Context"] = { multi_select: (patch.context ?? []).map((name) => ({ name })) };
  if ("when" in patch) properties["When"] = { select: patch.when ? { name: patch.when } : null };
  if ("due" in patch) properties["Due"] = { date: patch.due ? { start: patch.due } : null };
  if ("status" in patch) properties["Status"] = { select: { name: patch.status } };
  return properties;
}

async function handlePost(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { taskId?: string; patch?: InboxPatch };
  if (!body.taskId) {
    res.status(400).json({ error: "taskId가 없습니다." });
    return;
  }
  const properties = propertiesFromPatch(body.patch ?? {});
  if (!Object.keys(properties).length) {
    res.status(400).json({ error: "patch에 허용된 필드가 없습니다." });
    return;
  }
  await updatePageProperties(body.taskId, properties);
  res.status(200).json({ ok: true });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "POST") await handlePost(req, res);
    else await handleGet(res);
  } catch (err) {
    sendError(res, err, { endpoint: "inbox", databaseId: DB.tasks });
  }
}
