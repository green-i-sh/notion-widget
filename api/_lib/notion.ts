const NOTION_VERSION = "2022-06-28";
// 2025-09-03+ deprecates /v1/databases/{id}/query in favor of /v1/data_sources
// — a much bigger migration than this app has taken on, so queryDatabase and
// updatePageProperties stay on the old version. Page creation (parent:
// database_id is still valid there) and the File Upload API — which doesn't
// exist under the old version at all — use FILE_API_VERSION instead, scoped
// to just those calls so the query-endpoint deprecation never applies to them.
const FILE_API_VERSION = "2026-03-11";
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

/** Like authHeaders, but pinned to FILE_API_VERSION for page creation and the
 *  File Upload API — see the comment on FILE_API_VERSION for why. */
function fileApiHeaders(): Record<string, string> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new TokenMissingError();
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": FILE_API_VERSION,
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

export async function createPage(
  databaseId: string,
  properties: Record<string, unknown>,
  children?: unknown[]
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/pages`, {
    method: "POST",
    headers: fileApiHeaders(),
    body: JSON.stringify({ parent: { database_id: databaseId }, properties, ...(children ? { children } : {}) }),
  });
  if (!res.ok) await throwNotionError(res);
  return res.json() as Promise<{ id: string }>;
}

const COVER_FETCH_TIMEOUT_MS = 8000;
const MAX_COVER_BYTES = 5 * 1024 * 1024; // serverless memory guard — covers are never legitimately this big

function extensionFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function createFileUpload(filename: string, contentType: string): Promise<{ id: string; upload_url: string }> {
  const res = await fetch(`${API_BASE}/file_uploads`, {
    method: "POST",
    headers: fileApiHeaders(),
    body: JSON.stringify({ filename, content_type: contentType }),
  });
  if (!res.ok) await throwNotionError(res);
  return res.json() as Promise<{ id: string; upload_url: string }>;
}

/**
 * Downloads a remote image and uploads its bytes to Notion's File Upload
 * API, returning the resulting file_upload id to reference from a `files`
 * property. Some CDNs (Daum's book covers among them) block Notion's own
 * image proxy, so an `external` file reference to them silently never
 * renders — sending the bytes directly sidesteps that.
 *
 * Returns null on any failure (fetch, oversize, timeout, upload) instead of
 * throwing — callers should treat null as "skip the cover, keep going",
 * never as a reason to fail whatever else they were doing.
 */
export async function uploadCoverFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(COVER_FETCH_TIMEOUT_MS) });
    if (!imgRes.ok) {
      console.error("[notion] cover fetch failed", imageUrl, imgRes.status);
      return null;
    }

    const declaredLength = Number(imgRes.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_COVER_BYTES) {
      console.error("[notion] cover too large (content-length), skipping", imageUrl, declaredLength);
      return null;
    }

    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    if (bytes.byteLength > MAX_COVER_BYTES) {
      console.error("[notion] cover too large (downloaded), skipping", imageUrl, bytes.byteLength);
      return null;
    }

    const filename = `cover.${extensionFor(contentType)}`;
    const created = await createFileUpload(filename, contentType);

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: contentType }), filename);
    const headers = fileApiHeaders();
    delete headers["Content-Type"]; // let FormData set its own multipart boundary
    const sendRes = await fetch(created.upload_url, {
      method: "POST",
      headers,
      body: form,
      signal: AbortSignal.timeout(COVER_FETCH_TIMEOUT_MS),
    });
    if (!sendRes.ok) await throwNotionError(sendRes);

    return created.id;
  } catch (err) {
    console.error("[notion] cover upload failed", imageUrl, err);
    return null;
  }
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

/** Every file's URL from a `files` property — external link or Notion-hosted upload, in stored order. */
export function propFileUrls(prop: unknown): string[] {
  const p = prop as {
    type?: string;
    files?: { type?: string; file?: { url?: string }; external?: { url?: string } }[];
  } | undefined;
  if (p?.type !== "files") return [];
  return (p.files ?? [])
    .map((f) => (f.type === "external" ? f.external?.url : f.file?.url))
    .filter((url): url is string => Boolean(url));
}

/** First file's URL from a `files` property. */
export function propFileUrl(prop: unknown): string | null {
  return propFileUrls(prop)[0] ?? null;
}

export function propRelation(prop: unknown): string[] {
  const p = prop as { type?: string; relation?: { id: string }[] } | undefined;
  return p?.type === "relation" ? (p.relation ?? []).map((r) => r.id) : [];
}
