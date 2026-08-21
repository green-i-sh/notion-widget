/**
 * Client for the /api/* serverless functions. The Notion token never
 * reaches this file — every request just hits our own origin.
 */

import type { FetchOpts } from "../hooks/useApiData";

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

/** Builds a query string from optional params — every /api/* GET here takes a handful of optional filters. */
function withQuery(path: string, params: Record<string, string | undefined>): string {
  const qs = Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
}

/** Appends a bust-cache param and skips the browser's own cache — used right after a write. */
async function getJSON<T>(url: string, opts?: FetchOpts): Promise<T> {
  const bustUrl = opts?.bust ? `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}` : url;
  const res = await fetch(bustUrl, opts?.bust ? { cache: "no-store" } : undefined);
  const body = (await res.json().catch(() => null)) as (T & ErrorBody) | null;
  if (!res.ok) throw new Error(describeError(body, res.status));
  return body as T;
}

async function postJSON(url: string, payload: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null;
    throw new Error(describeError(body, res.status));
  }
}

export function fetchToday(date?: string, opts?: FetchOpts): Promise<TodaySummary> {
  return getJSON(withQuery("/api/today", { date }), opts);
}

export function fetchRoutineWeek(date?: string, opts?: FetchOpts): Promise<RoutineWeek> {
  return getJSON(withQuery("/api/routine", { date }), opts);
}

export function toggleRoutine(pageId: string, routine: Routine, value: boolean): Promise<void> {
  return postJSON("/api/routine", { pageId, routine, value });
}

export function fetchTimeline(date?: string, opts?: FetchOpts): Promise<TimelineDay> {
  return getJSON(withQuery("/api/timeline", { date }), opts);
}

export type BingoBoard = "monthly" | "quarterly";

export interface BingoItem {
  id: string;
  name: string;
  board: string;
  no: number;
  done: boolean;
}

export interface BingoBoardData {
  board: string;
  items: BingoItem[];
  done: number;
  total: number;
}

export function fetchBingo(board?: BingoBoard, opts?: FetchOpts): Promise<BingoBoardData> {
  return getJSON(withQuery("/api/bingo", { board }), opts);
}

export function toggleBingo(pageId: string, value: boolean): Promise<void> {
  return postJSON("/api/bingo", { pageId, value });
}

export interface MonthFinance {
  month: string;
  expenseTotal: number;
  fixedTotal: number;
  variableTotal: number;
  incomeTotal: number;
  incomeCategories: string[];
  budgetTotal: number | null;
  budgetLeft: number | null;
}

export function fetchFinanceMonth(month?: string, opts?: FetchOpts): Promise<MonthFinance> {
  return getJSON(withQuery("/api/finance-month", { month }), opts);
}

export interface CardLoanItem {
  name: string;
  date: string | null;
  amount: number;
}

export interface FinanceSummary extends MonthFinance {
  cardLoan: { total: number; items: CardLoanItem[] };
}

export function fetchFinance(month?: string, opts?: FetchOpts): Promise<FinanceSummary> {
  return getJSON(withQuery("/api/finance", { month }), opts);
}

export interface LifeStat {
  key: string;
  label: string;
  count: number;
  names: string[];
}

export interface LifeData {
  month: string;
  stats: LifeStat[];
}

export function fetchLife(month?: string, opts?: FetchOpts): Promise<LifeData> {
  return getJSON(withQuery("/api/life", { month }), opts);
}

export type ReviewType = "monthly" | "quarterly";

export interface ReviewStat {
  key: string;
  label: string;
  value: string;
  caption: string;
}

export interface ReviewData {
  type: string;
  found: boolean;
  stats: ReviewStat[];
}

export function fetchReview(type?: ReviewType, opts?: FetchOpts): Promise<ReviewData> {
  return getJSON(withQuery("/api/review", { type }), opts);
}

export interface ShelfRow {
  key: string;
  label: string;
  value: string;
}

export function fetchShelf(opts?: FetchOpts): Promise<{ rows: ShelfRow[] }> {
  return getJSON("/api/shelf", opts);
}

export interface CategoryRow {
  category: string;
  amount: number;
  /** null when the previous month had no data for this category — nothing to compare against. */
  delta: number | null;
}

export interface CategoryData {
  month: string;
  rows: CategoryRow[];
  total: number;
}

export function fetchCategory(month?: string, opts?: FetchOpts): Promise<CategoryData> {
  return getJSON(withQuery("/api/category", { month }), opts);
}

export interface TripColumn {
  key: string;
  label: string;
  text: string;
}

export interface TripData {
  found: boolean;
  name?: string;
  phase?: string;
  columns?: TripColumn[];
}

export function fetchTrip(trip?: string, opts?: FetchOpts): Promise<TripData> {
  return getJSON(withQuery("/api/trip", { trip }), opts);
}

export interface StreakData {
  month: string;
  streakDays: number;
}

export function fetchStreak(opts?: FetchOpts): Promise<StreakData> {
  return getJSON("/api/streak", opts);
}
