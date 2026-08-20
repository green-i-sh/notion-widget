import { useSyncExternalStore } from "react";
import type {
  AppData,
  AppState,
  Appearance,
  WidgetConfig,
  WidgetType,
} from "../types";
import { clearState, loadState, mergeState, saveState } from "../services/storage";
import { uid } from "../utils/id";
import { todayISO } from "../utils/date";

const DEFAULT_APPEARANCE: Appearance = {
  theme: "default",
  custom: {},
  radius: 6,
  gap: 14,
  columns: 2,
  compact: false,
};

/** Widgets shown on a fresh install, in reading order. */
const STARTER: WidgetType[] = [
  "clock",
  "calendar",
  "schedule",
  "dday",
  "todo",
  "habit",
  "progress",
  "memo",
  "timer",
  "quote",
];

function defaultWidgets(): WidgetConfig[] {
  const all: WidgetType[] = [
    ...STARTER,
    "countdown",
    "stopwatch",
    "link",
    "image",
    "weather",
    "routine",
    "today",
    "timeline",
  ];
  return all.map((type, i) => ({
    id: `w-${type}`,
    type,
    visible: STARTER.includes(type),
    size: type === "calendar" || type === "todo" || type === "timeline" ? "m" : "s",
    order: i,
    options: {},
  }));
}

function defaultData(): AppData {
  return {
    schedule: [],
    todos: [],
    memos: [],
    ddays: [],
    habits: [
      { id: uid(), name: "Exercise", done: [] },
      { id: uid(), name: "Reading", done: [] },
      { id: uid(), name: "Organizing", done: [] },
      { id: uid(), name: "Other", done: [] },
    ],
    progress: [],
    links: [],
    quotes: [
      { id: uid(), text: "오늘 하루도 천천히 가면 된다.", author: "" },
      { id: uid(), text: "기록은 기억보다 오래 남는다.", author: "" },
      { id: uid(), text: "작게 시작해도 시작은 시작이다.", author: "" },
    ],
  };
}

export function defaultState(): AppState {
  return {
    version: 1,
    appearance: DEFAULT_APPEARANCE,
    widgets: defaultWidgets(),
    data: defaultData(),
  };
}

let state: AppState = loadState(defaultState());
const listeners = new Set<() => void>();

function set(next: AppState): void {
  state = next;
  saveState(state);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = (): AppState => state;

/** Subscribes a component to the whole state. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ---------------- actions ---------------- */

export const actions = {
  setAppearance(patch: Partial<Appearance>): void {
    set({ ...state, appearance: { ...state.appearance, ...patch } });
  },

  setCustomColor(key: keyof Appearance["custom"], value: string | null): void {
    const custom = { ...state.appearance.custom };
    if (value === null) delete custom[key];
    else custom[key] = value;
    set({ ...state, appearance: { ...state.appearance, custom } });
  },

  updateWidget(id: string, patch: Partial<WidgetConfig>): void {
    set({
      ...state,
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });
  },

  setWidgetOption(id: string, key: string, value: unknown): void {
    set({
      ...state,
      widgets: state.widgets.map((w) =>
        w.id === id ? { ...w, options: { ...w.options, [key]: value } } : w
      ),
    });
  },

  /** Moves the dragged widget into the target's slot and renumbers. */
  moveWidget(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;
    const ordered = [...state.widgets].sort((a, b) => a.order - b.order);
    const from = ordered.findIndex((w) => w.id === draggedId);
    const to = ordered.findIndex((w) => w.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    set({
      ...state,
      widgets: ordered.map((w, i) => ({ ...w, order: i })),
    });
  },

  /** Replaces one data collection. */
  setData<K extends keyof AppData>(key: K, value: AppData[K]): void {
    set({ ...state, data: { ...state.data, [key]: value } });
  },

  toggleHabit(habitId: string, iso: string = todayISO()): void {
    const habits = state.data.habits.map((h) => {
      if (h.id !== habitId) return h;
      const done = h.done.includes(iso)
        ? h.done.filter((d) => d !== iso)
        : [...h.done, iso];
      return { ...h, done };
    });
    actions.setData("habits", habits);
  },

  replaceAll(next: AppState): void {
    set(next);
  },

  reset(): void {
    clearState();
    set(defaultState());
  },
};

/* ---------------- import / export ---------------- */

export function exportState(): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Validates and applies an imported backup.
 * Returns an error message instead of throwing so the UI can show it.
 */
export function importState(json: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return "JSON 형식이 아닙니다. 파일을 다시 확인해 주세요.";
  }
  if (typeof parsed !== "object" || parsed === null) {
    return "백업 파일의 구조가 올바르지 않습니다.";
  }
  set(mergeState(defaultState(), parsed));
  return null;
}
