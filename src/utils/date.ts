export const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;
export const WEEKDAYS_EN = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

/** Local YYYY-MM-DD. toISOString() would shift the day in KST. */
export function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days from today to the target. Negative means the date has passed. */
export function daysUntil(iso: string): number | null {
  const target = parseISODate(iso);
  if (!target) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/** Monday of the week containing the given date. */
export function mondayOf(d: Date): Date {
  const shift = (d.getDay() + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - shift);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

export function weekDates(from: Date = new Date()): string[] {
  const mon = mondayOf(from);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toISODate(d);
  });
}

/** Month laid out in whole Monday-first weeks. null marks padding cells. */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= total; d += 1) {
    cells.push(toISODate(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function pad2(n: number): string {
  return `${n}`.padStart(2, "0");
}

/** Seconds to HH:MM:SS. */
export function hhmmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map(pad2)
    .join(":");
}
