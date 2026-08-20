/**
 * Client for the /api/* serverless functions. The Notion token never
 * reaches this file — every request just hits our own origin.
 */

export type Routine = "Exercise" | "Reading" | "Organizing" | "Other";

export interface TodaySummary {
  date: string;
  found: boolean;
  tasksDone?: number;
  tasksTotal?: number;
  trackedMin?: number;
  expense?: number;
  morningPage?: string;
}

export interface RoutineDay {
  date: string;
  pageId: string | null;
  values: Record<Routine, boolean> | null;
}

export interface RoutineWeek {
  start: string;
  end: string;
  days: RoutineDay[];
}

export interface TimelineEntry {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  durationMin: number;
  note: string;
}

export interface TimelineDay {
  date: string;
  totalMin: number;
  entries: TimelineEntry[];
}

interface ErrorBody {
  error?: string;
  message?: string;
  status?: number;
  notionCode?: string;
  databaseId?: string;
  pageId?: string;
}

/** Renders the server's error JSON as-is — category, message, and where it happened. */
function describeError(body: ErrorBody | null, status: number): string {
  if (!body) return `요청 실패 (${status})`;
  const parts = [body.error, body.message].filter(Boolean);
  if (body.notionCode) parts.push(`[${body.notionCode}]`);
  if (body.databaseId) parts.push(`DB ${body.databaseId}`);
  return parts.length ? parts.join(" — ") : `요청 실패 (${status})`;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => null)) as (T & ErrorBody) | null;
  if (!res.ok) throw new Error(describeError(body, res.status));
  return body as T;
}

export function fetchToday(date?: string): Promise<TodaySummary> {
  return getJSON(`/api/today${date ? `?date=${date}` : ""}`);
}

export function fetchRoutineWeek(start?: string): Promise<RoutineWeek> {
  return getJSON(`/api/routine${start ? `?start=${start}` : ""}`);
}

export async function toggleRoutine(pageId: string, routine: Routine, value: boolean): Promise<void> {
  const res = await fetch("/api/routine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId, routine, value }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null;
    throw new Error(describeError(body, res.status));
  }
}

export function fetchTimeline(date?: string): Promise<TimelineDay> {
  return getJSON(`/api/timeline${date ? `?date=${date}` : ""}`);
}
