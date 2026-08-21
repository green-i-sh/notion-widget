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

/** Monday of the week containing the given YYYY-MM-DD date. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const shift = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - shift);
  return date.toISOString().slice(0, 10);
}
