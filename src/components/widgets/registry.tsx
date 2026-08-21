import type { ComponentType } from "react";
import type { WidgetConfig, WidgetType } from "../../types";
import { ClockWidget } from "./ClockWidget";
import { CalendarWidget } from "./CalendarWidget";
import { ScheduleWidget } from "./ScheduleWidget";
import { DdayWidget } from "./DdayWidget";
import { CountdownWidget } from "./CountdownWidget";
import { TodoWidget } from "./TodoWidget";
import { MemoWidget } from "./MemoWidget";
import { HabitWidget } from "./HabitWidget";
import { ProgressWidget } from "./ProgressWidget";
import { QuoteWidget } from "./QuoteWidget";
import { TimerWidget } from "./TimerWidget";
import { StopwatchWidget } from "./StopwatchWidget";
import { LinkWidget } from "./LinkWidget";
import { ImageWidget } from "./ImageWidget";
import { WeatherWidget } from "./WeatherWidget";
import { RoutineWidget } from "./RoutineWidget";
import { TodayWidget } from "./TodayWidget";
import { TimelineWidget } from "./TimelineWidget";

/** Widgets receive their config; most ignore it. */
export type WidgetProps = { config: WidgetConfig };

interface Entry {
  title: string;
  Component: ComponentType<WidgetProps>;
  /** Notion-embedded widgets (WIDGET-SPEC.md) read as a page block, not a dashboard card — no border, transparent bg, in standalone (?w=) mode. */
  flush?: boolean;
}

/** Single source of truth. Adding a widget means adding one line here. */
export const WIDGETS: Record<WidgetType, Entry> = {
  clock: { title: "Clock", Component: ClockWidget },
  calendar: { title: "Calendar", Component: CalendarWidget },
  schedule: { title: "Schedule", Component: ScheduleWidget },
  dday: { title: "D-Day", Component: DdayWidget },
  countdown: { title: "Countdown", Component: CountdownWidget },
  todo: { title: "Todo", Component: TodoWidget },
  memo: { title: "Memo", Component: MemoWidget },
  habit: { title: "Habit", Component: HabitWidget },
  progress: { title: "Progress", Component: ProgressWidget },
  quote: { title: "Quote", Component: QuoteWidget },
  timer: { title: "Timer", Component: TimerWidget },
  stopwatch: { title: "Stopwatch", Component: StopwatchWidget },
  link: { title: "Link", Component: LinkWidget },
  image: { title: "Image", Component: ImageWidget },
  weather: { title: "Weather", Component: WeatherWidget },
  routine: { title: "Routine", Component: RoutineWidget, flush: true },
  today: { title: "Today", Component: TodayWidget, flush: true },
  timeline: { title: "Timeline", Component: TimelineWidget, flush: true },
};
