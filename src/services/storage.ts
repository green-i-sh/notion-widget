import type { AppState } from "../types";

const KEY = "mlp-widget-station";

/**
 * Reads persisted state. Never throws: a corrupted or unavailable
 * localStorage falls back to the caller's defaults.
 */
export function loadState(fallback: AppState): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return mergeState(fallback, parsed);
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full quota. Losing persistence is survivable.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to recover from.
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Shallow-merges stored values over defaults so that a state written by an
 * older version, or a hand-edited import, cannot leave required keys missing.
 */
export function mergeState(fallback: AppState, incoming: unknown): AppState {
  if (!isRecord(incoming)) return fallback;

  const appearance = isRecord(incoming.appearance)
    ? { ...fallback.appearance, ...incoming.appearance }
    : fallback.appearance;

  const widgets = Array.isArray(incoming.widgets)
    ? (incoming.widgets as AppState["widgets"]).filter(
        (w) => isRecord(w) && typeof w.id === "string" && typeof w.type === "string"
      )
    : fallback.widgets;

  const data = isRecord(incoming.data)
    ? { ...fallback.data, ...pickArrays(incoming.data, fallback.data) }
    : fallback.data;

  return {
    version: fallback.version,
    appearance,
    widgets: widgets.length ? widgets : fallback.widgets,
    data,
  };
}

/** Keeps only keys the current schema knows about, and only if they are arrays. */
function pickArrays(
  incoming: Record<string, unknown>,
  shape: AppState["data"]
): Partial<AppState["data"]> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(shape)) {
    const value = incoming[key];
    if (Array.isArray(value)) out[key] = value;
  }
  return out as Partial<AppState["data"]>;
}
