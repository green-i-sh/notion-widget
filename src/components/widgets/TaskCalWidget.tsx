import { fetchTaskCal } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { monthGrid, todayISO, monthParam, WEEKDAYS_KO } from "../../utils/date";
import { notionUrl } from "../../utils/notionUrl";

const DOW = WEEKDAYS_KO;
const PRIORITY_COLOR: Record<string, string> = { Highest: "pink", Medium: "yellow", Lowest: "gray" };
const VISIBLE = 2;

export function TaskCalWidget() {
  const month = monthParam();
  const today = todayISO();
  const now = new Date();
  const [year, month0] = month
    ? [Number(month.split(".")[0]), Number(month.split(".")[1]) - 1]
    : [now.getFullYear(), now.getMonth()];

  const { data, error } = useApiData((opts) => fetchTaskCal(month, opts), [month]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  const byDate = new Map(data.days.map((d) => [d.date, d.tasks]));
  const cells = monthGrid(year, month0, true);

  return (
    <div className="photo-cal-grid taskcal-grid" role="grid">
      {DOW.map((d) => (
        <div key={d} className="cal-dow">{d}</div>
      ))}
      {cells.map((iso, i) => {
        if (!iso) return <div key={`pad-${i}`} className="photo-cal-cell" />;
        const tasks = byDate.get(iso) ?? [];
        const dayNum = Number(iso.slice(8));
        const shown = tasks.length > 3 ? tasks.slice(0, VISIBLE) : tasks;
        const overflow = tasks.length > 3 ? tasks.length - VISIBLE : 0;
        return (
          <div key={iso} className={`photo-cal-cell${iso === today ? " today" : ""}`}>
            <span className="photo-cal-num">{dayNum}</span>
            <div className="taskcal-chips">
              {shown.map((t) => (
                <a
                  key={t.id}
                  className={`embed-chip ${PRIORITY_COLOR[t.priority] ?? "gray"}`}
                  href={notionUrl(t.id)}
                  target="_blank"
                  rel="noreferrer"
                  title={t.name}
                >
                  {t.name}
                </a>
              ))}
              {overflow > 0 && <span className="embed-chip gray">+{overflow}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
