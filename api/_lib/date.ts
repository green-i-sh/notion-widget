const TZ = "Asia/Seoul";

/** Today as YYYY-MM-DD in KST, regardless of the server's own timezone. */
export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Now as an ISO datetime with the +09:00 (KST) offset, for datetime property writes. */
export function nowKST(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+09:00`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** "YYYY.MM" for the given YYYY-MM-DD date (or today, KST) — matches Finance/Budget's Month property format. */
export function monthOf(iso: string = todayKST()): string {
  return iso.slice(0, 7).replace("-", ".");
}

/** Start/end YYYY-MM-DD for a "YYYY.MM" month — day 0 of the next JS month
 *  rolls back to the last day of this one, so no separate leap-year math. */
export function monthDateRange(month: string): { start: string; end: string } {
  const [y, m] = month.split(".").map(Number);
  const start = `${month.replace(".", "-")}-01`;
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { start, end };
}

/** The "YYYY.MM" one calendar month before the given "YYYY.MM". */
export function prevMonthOf(month: string): string {
  const [y, m] = month.split(".").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Monday of the week containing the given YYYY-MM-DD date. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const shift = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - shift);
  return date.toISOString().slice(0, 10);
}
