/** Every widget kind the station knows how to render. */
export type WidgetType =
  | "clock"
  | "local-calendar"
  | "calendar"
  | "schedule"
  | "dday"
  | "countdown"
  | "todo"
  | "memo"
  | "habit"
  | "progress"
  | "quote"
  | "timer"
  | "stopwatch"
  | "link"
  | "image"
  | "weather"
  | "routine"
  | "today"
  | "timeline"
  | "bingo"
  | "finance"
  | "finance-month"
  | "life"
  | "review"
  | "shelf"
  | "category"
  | "trip"
  | "streak"
  | "morning"
  | "meta";

/** How much grid space a widget takes. */
export type WidgetSize = "s" | "m" | "l";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  visible: boolean;
  size: WidgetSize;
  /** Position in the grid, ascending. */
  order: number;
  /** Widget-specific options, shaped by each widget. */
  options: Record<string, unknown>;
}

export type ThemeName =
  | "default"
  | "paper"
  | "lavender"
  | "sage"
  | "warm"
  | "dark";

export interface Palette {
  bg: string;
  surface: string;
  text: string;
  subtext: string;
  accent: string;
  border: string;
}

export interface Appearance {
  theme: ThemeName;
  /** Overrides applied on top of the theme palette. */
  custom: Partial<Palette>;
  radius: number;
  gap: number;
  columns: number;
  compact: boolean;
}

/* ---- Widget data ---- */

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
}

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  priority: "high" | "normal" | "low";
  date: string | null;
}

export interface MemoItem {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export interface DdayItem {
  id: string;
  title: string;
  date: string;
}

export interface HabitItem {
  id: string;
  name: string;
  /** ISO dates that are checked off. */
  done: string[];
}

export interface ProgressItem {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface QuoteItem {
  id: string;
  text: string;
  author: string;
}

export interface AppData {
  schedule: ScheduleItem[];
  todos: TodoItem[];
  memos: MemoItem[];
  ddays: DdayItem[];
  habits: HabitItem[];
  progress: ProgressItem[];
  links: LinkItem[];
  quotes: QuoteItem[];
}

export interface AppState {
  version: number;
  appearance: Appearance;
  widgets: WidgetConfig[];
  data: AppData;
}
