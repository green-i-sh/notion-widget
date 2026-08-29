import { fetchCalendarMonth } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { monthGrid, todayISO, monthParam, WEEKDAYS_KO } from "../../utils/date";
import { notionUrl } from "../../utils/notionUrl";

const DOW = WEEKDAYS_KO;

/** Life-photo month calendar (WORK-ORDER.md #6) — one Life record's photo
 *  per day, for the ?w=calendar Notion embed. Clicking a day opens that
 *  date's Daily Log page (not the Life record). Not the dashboard's local
 *  schedule calendar; see LocalCalendarWidget for that. */
export function CalendarWidget() {
  const month = monthParam(); // "YYYY.MM", or undefined for the current month
  const today = todayISO();
  const now = new Date();
  const [year, month0] = month
    ? [Number(month.split(".")[0]), Number(month.split(".")[1]) - 1]
    : [now.getFullYear(), now.getMonth()];

  const { data, error } = useApiData((opts) => fetchCalendarMonth(month, opts), [month]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  const byDate = new Map(data.days.map((d) => [d.date, d]));
  const cells = monthGrid(year, month0, true);

  return (
    <div className="photo-cal-grid" role="grid">
      {DOW.map((d) => (
        <div key={d} className="cal-dow">{d}</div>
      ))}
      {cells.map((iso, i) => {
        if (!iso) return <div key={`pad-${i}`} className="photo-cal-cell" />;
        const entry = byDate.get(iso);
        const dayNum = Number(iso.slice(8));
        const cls = `photo-cal-cell${iso === today ? " today" : ""}`;
        const content = (
          <>
            {entry?.photo && (
              <span className="photo-cal-stamp" style={{ backgroundImage: `url(${entry.photo})` }} />
            )}
            <span className="photo-cal-num">{dayNum}</span>
          </>
        );

        if (entry?.pageId) {
          return (
            <a key={iso} href={notionUrl(entry.pageId)} target="_blank" rel="noreferrer" className={cls}>
              {content}
            </a>
          );
        }
        return (
          <div key={iso} className={cls}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
