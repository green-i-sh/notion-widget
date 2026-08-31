import type { ComponentType } from "react";
import type { WidgetConfig, WidgetType } from "../../types";
import { ClockWidget } from "./ClockWidget";
import { LocalCalendarWidget } from "./LocalCalendarWidget";
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
import { BingoWidget } from "./BingoWidget";
import { FinanceWidget } from "./FinanceWidget";
import { FinanceMonthWidget } from "./FinanceMonthWidget";
import { FixedWidget } from "./FixedWidget";
import { LifeWidget } from "./LifeWidget";
import { ReviewWidget } from "./ReviewWidget";
import { ShelfWidget } from "./ShelfWidget";
import { CategoryWidget } from "./CategoryWidget";
import { TripWidget } from "./TripWidget";
import { StreakWidget } from "./StreakWidget";
import { MorningWidget } from "./MorningWidget";
import { MetaWidget } from "./MetaWidget";
import { BookAddWidget } from "./BookAddWidget";
import { TasksWidget } from "./TasksWidget";
import { InboxWidget } from "./InboxWidget";
import { NextWidget } from "./NextWidget";
import { ProjectsWidget } from "./ProjectsWidget";
import { TaskCalWidget } from "./TaskCalWidget";
import { AddWidget } from "./AddWidget";

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
  "local-calendar": { title: "Calendar", Component: LocalCalendarWidget },
  calendar: { title: "Calendar (Life)", Component: CalendarWidget, flush: true },
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
  bingo: { title: "Bingo", Component: BingoWidget, flush: true },
  finance: { title: "Finance", Component: FinanceWidget, flush: true },
  "finance-month": { title: "Finance · Month", Component: FinanceMonthWidget, flush: true },
  fixed: { title: "Fixed Expense", Component: FixedWidget, flush: true },
  life: { title: "Life", Component: LifeWidget, flush: true },
  review: { title: "Review", Component: ReviewWidget, flush: true },
  shelf: { title: "Shelf", Component: ShelfWidget, flush: true },
  category: { title: "By Category", Component: CategoryWidget, flush: true },
  trip: { title: "Trip", Component: TripWidget, flush: true },
  streak: { title: "Streak", Component: StreakWidget, flush: true },
  morning: { title: "Morning", Component: MorningWidget, flush: true },
  meta: { title: "Meta", Component: MetaWidget, flush: true },
  "book-add": { title: "Book Add", Component: BookAddWidget, flush: true },
  tasks: { title: "Tasks", Component: TasksWidget, flush: true },
  inbox: { title: "Inbox", Component: InboxWidget, flush: true },
  next: { title: "Next Actions", Component: NextWidget, flush: true },
  projects: { title: "Projects", Component: ProjectsWidget, flush: true },
  taskcal: { title: "Task Calendar", Component: TaskCalWidget, flush: true },
  add: { title: "Quick Add", Component: AddWidget, flush: true },
};
