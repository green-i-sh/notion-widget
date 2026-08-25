import { queryDatabase, createPage } from "./notion.js";
import { DB } from "./db.js";

export interface DailyLogPage {
  id: string;
}

async function findDailyLogPage(date: string): Promise<DailyLogPage | null> {
  const result = await queryDatabase(DB.dailyLog, {
    filter: { property: "Date", date: { equals: date } },
    page_size: 1,
  });
  return result.results[0] ? { id: result.results[0].id } : null;
}

/**
 * Finds the Daily Log row for `date`, creating it if missing. Widgets
 * (morning/routine/today) die silently without today's row, so write paths
 * (morning autosave, routine toggle) self-heal it here — a plain read
 * (today widget) must never create one, so this is only ever called from a
 * write handler. Re-checks right before creating so two writes landing at
 * once (e.g. a routine toggle and a morning autosave) don't each create
 * their own row.
 * ponytail: recheck-then-create still has a race window between the
 * recheck and createPage — add a real lock only if duplicate rows show up.
 */
export async function ensureDailyLogPage(date: string): Promise<DailyLogPage> {
  const existing = await findDailyLogPage(date);
  if (existing) return existing;

  const recheck = await findDailyLogPage(date);
  if (recheck) return recheck;

  const created = await createPage(DB.dailyLog, {
    Name: { title: [{ text: { content: date.replace(/-/g, ".") } }] },
    Date: { date: { start: date } },
    "Morning Page": { select: { name: "미작성" } },
    Exercise: { checkbox: false },
    Reading: { checkbox: false },
    Organizing: { checkbox: false },
    Other: { checkbox: false },
  });
  return { id: created.id };
}
