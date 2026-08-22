const NOTION_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";

export class TokenMissingError extends Error {
  constructor() {
    super("NOTION_TOKEN이 설정되지 않았습니다.");
    this.name = "TokenMissingError";
  }
}

/** Wraps a non-2xx response from Notion, keeping its status and message. */
export class NotionApiError extends Error {
  status: number;
  notionCode?: string;

  constructor(message: string, status: number, notionCode?: string) {
    super(message);
    this.name = "NotionApiError";
    this.status = status;
    this.notionCode = notionCode;
  }
}

function authHeaders(): Record<string, string> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new TokenMissingError();
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function throwNotionError(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as { message?: string; code?: string } | null;
  throw new NotionApiError(body?.message ?? `Notion이 ${res.status}을 반환했습니다.`, res.status, body?.code);
}

export async function queryDatabase(
  databaseId: string,
  body: Record<string, unknown>
): Promise<{ results: { id: string; properties: Record<string, unknown> }[] }> {
  const res = await fetch(`${API_BASE}/databases/${databaseId}/query`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwNotionError(res);
  return res.json() as Promise<{ results: { id: string; properties: Record<string, unknown> }[] }>;
}

export async function updatePageProperties(
  pageId: string,
  properties: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) await throwNotionError(res);
}

/** rich_text property payload for a page update — an empty string clears the property. */
export function richTextProperty(value: string): { rich_text: { text: { content: string } }[] } {
  return { rich_text: value ? [{ text: { content: value } }] : [] };
}

export async function createPage(databaseId: string, properties: Record<string, unknown>): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/pages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });
  if (!res.ok) await throwNotionError(res);
  return res.json() as Promise<{ id: string }>;
}

export async function retrievePage(pageId: string): Promise<{ id: string; properties: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) await throwNotionError(res);
  return res.json() as Promise<{ id: string; properties: Record<string, unknown> }>;
}

/**
 * Notion property readers. rollup values live at .rollup.number, formula
 * values at .formula.number/.string — reading .number directly returns
 * nothing for either, so each type is unwrapped explicitly.
 */
export function propNumber(prop: unknown): number {
  const p = prop as { type?: string; rollup?: { number?: number }; formula?: { number?: number }; number?: number } | undefined;
  const value =
    p?.type === "rollup" ? p.rollup?.number
    : p?.type === "formula" ? p.formula?.number
    : p?.type === "number" ? p.number
    : undefined;
  return typeof value === "number" ? value : 0;
}

/** Like propNumber, but distinguishes "never set" from a real 0 — used where
 *  WIDGET-SPEC/WORK-ORDER call for a `—` when a rollup/number property is empty. */
export function propNumberOrNull(prop: unknown): number | null {
  const p = prop as { type?: string; rollup?: { number?: number }; formula?: { number?: number }; number?: number } | undefined;
  const value =
    p?.type === "rollup" ? p.rollup?.number
    : p?.type === "formula" ? p.formula?.number
    : p?.type === "number" ? p.number
    : undefined;
  return typeof value === "number" ? value : null;
}

export function propString(prop: unknown): string {
  const p = prop as {
    type?: string;
    formula?: { string?: string | null };
    select?: { name?: string } | null;
    title?: { plain_text: string }[];
    rich_text?: { plain_text: string }[];
  } | undefined;
  if (p?.type === "formula") return p.formula?.string ?? "";
  if (p?.type === "select") return p.select?.name ?? "";
  if (p?.type === "title") return (p.title ?? []).map((t) => t.plain_text).join("");
  if (p?.type === "rich_text") return (p.rich_text ?? []).map((t) => t.plain_text).join("");
  return "";
}

export function propCheckbox(prop: unknown): boolean {
  const p = prop as { type?: string; checkbox?: boolean } | undefined;
  return p?.type === "checkbox" ? Boolean(p.checkbox) : false;
}

export function propDateStart(prop: unknown): string | null {
  const p = prop as { type?: string; date?: { start?: string | null } | null } | undefined;
  return p?.type === "date" ? p.date?.start ?? null : null;
}

export function propDateRange(prop: unknown): { start: string | null; end: string | null } {
  const p = prop as { type?: string; date?: { start?: string | null; end?: string | null } | null } | undefined;
  if (p?.type !== "date") return { start: null, end: null };
  return { start: p.date?.start ?? null, end: p.date?.end ?? null };
}

export function propMultiSelect(prop: unknown): string[] {
  const p = prop as { type?: string; multi_select?: { name: string }[] } | undefined;
  return p?.type === "multi_select" ? (p.multi_select ?? []).map((t) => t.name) : [];
}

/** First file's URL from a `files` property — external link or Notion-hosted upload. */
export function propFileUrl(prop: unknown): string | null {
  const p = prop as {
    type?: string;
    files?: { type?: string; file?: { url?: string }; external?: { url?: string } }[];
  } | undefined;
  if (p?.type !== "files") return null;
  const first = p.files?.[0];
  if (!first) return null;
  return (first.type === "external" ? first.external?.url : first.file?.url) ?? null;
}

export function propRelation(prop: unknown): string[] {
  const p = prop as { type?: string; relation?: { id: string }[] } | undefined;
  return p?.type === "relation" ? (p.relation ?? []).map((r) => r.id) : [];
}
