import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, updatePageProperties, createPage, retrievePage, propString, propNumber, propDateStart, propMultiSelect, propRelation } from "../notion.js";
import { todayKST, nowKST, addDays } from "../date.js";
import { sendError } from "../http.js";
import { requireKey } from "../auth.js";
import { assertParentDb } from "../guard.js";
import { DB } from "../db.js";

const ACTIONS = ["start", "pause", "done"] as const;
type Action = (typeof ACTIONS)[number];

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === "POST") {
    if (!requireKey(req, res)) return;
    await handleAction(req, res);
    return;
  }
  await handleList(req, res);
}

interface ActiveTimeLog {
  taskId: string;
  start: string;
}

/** The one Time Log row (if any) with no End yet — restores "in progress" on reload. */
async function findActive(date: string): Promise<ActiveTimeLog | null> {
  const startISO = `${date}T00:00:00+09:00`;
  const endISO = `${addDays(date, 1)}T00:00:00+09:00`;
  const result = await queryDatabase(DB.timeLog, {
    filter: {
      and: [
        { property: "Start", date: { on_or_after: startISO } },
        { property: "Start", date: { before: endISO } },
        { property: "End", date: { is_empty: true } },
      ],
    },
    page_size: 1,
  });
  const page = result.results[0];
  if (!page) return null;
  const taskId = propRelation(page.properties["Task"])[0];
  const start = propDateStart(page.properties["Start"]);
  if (!taskId || !start) return null;
  return { taskId, start };
}

async function handleList(req: ApiRequest, res: ApiResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();

  try {
    const [tasksResult, active] = await Promise.all([
      queryDatabase(DB.tasks, {
        filter: { property: "Due", date: { equals: date } },
        sorts: [{ property: "Priority", direction: "ascending" }],
        page_size: 50,
      }),
      findActive(date),
    ]);

    const tasks = tasksResult.results.map((page) => ({
      id: page.id,
      name: propString(page.properties["Name"]),
      priority: propString(page.properties["Priority"]),
      context: propMultiSelect(page.properties["Context"]),
      trackedMin: propNumber(page.properties["Tracked"]),
      done: propString(page.properties["Status"]) === "Done",
    }));

    res.status(200).json({ date, tasks, active });
  } catch (err) {
    sendError(res, err, { endpoint: "tasks", databaseId: DB.tasks });
  }
}

/** Ends the running Time Log row, if any — every task's when no `taskId` is
 *  given (start switches tasks, so whatever was running must stop first), or
 *  just `taskId`'s own row when scoped (pause/done act on one task only). */
async function pauseRunning(taskId?: string): Promise<void> {
  const endEmpty = { property: "End", date: { is_empty: true } } as const;
  const filter = taskId ? { and: [{ property: "Task", relation: { contains: taskId } }, endEmpty] } : endEmpty;
  const result = await queryDatabase(DB.timeLog, { filter, page_size: 1 });
  const page = result.results[0];
  if (page) await updatePageProperties(page.id, { End: { date: { start: nowKST() } } });
}

async function handleAction(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { action?: string; taskId?: string };
  const action = body.action as Action;
  const taskId = body.taskId;
  if (!ACTIONS.includes(action) || !taskId) {
    res.status(400).json({ error: "잘못된 요청입니다." });
    return;
  }

  try {
    if (action === "start") {
      await pauseRunning();
      const task = await retrievePage(taskId);
      await createPage(DB.timeLog, {
        Name: { title: [{ text: { content: propString(task.properties["Name"]) } }] },
        Task: { relation: [{ id: taskId }] },
        Start: { date: { start: nowKST() } },
      });
    } else if (action === "pause") {
      await pauseRunning(taskId);
    } else if (action === "done") {
      if (!(await assertParentDb(taskId, DB.tasks, res))) return;
      await pauseRunning(taskId);
      await updatePageProperties(taskId, {
        Status: { select: { name: "Done" } },
        Completed: { date: { start: todayKST() } },
      });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "tasks", databaseId: DB.tasks, taskId, action });
  }
}
