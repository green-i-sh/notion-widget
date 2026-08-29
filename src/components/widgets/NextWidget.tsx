import { fetchNext, type NextTask } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { notionUrl } from "../../utils/notionUrl";

const PRIORITY_COLOR: Record<string, string> = { Highest: "pink", Medium: "yellow", Lowest: "gray" };
const NO_CONTEXT = "없음";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatDue(due: string | null): string {
  return due ? due.slice(5).replace("-", ".") : "";
}

export function NextWidget() {
  const { data, error } = useApiData((opts) => fetchNext(opts), []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.tasks.length) return <div className="empty-box">다음 행동이 없습니다</div>;

  const columns = new Map<string, NextTask[]>();
  for (const task of data.tasks) {
    for (const context of task.context.length ? task.context : [NO_CONTEXT]) {
      const list = columns.get(context);
      if (list) list.push(task);
      else columns.set(context, [task]);
    }
  }

  return (
    <div className="next-board">
      {[...columns.entries()].map(([context, tasks]) => (
        <div key={context} className="next-col">
          <div className="next-col-head">
            <span className="embed-chip lav">@{context}</span>
            <span className="muted">{tasks.length}</span>
          </div>
          {tasks.map((t) => (
            <a key={t.id} className="next-card" href={notionUrl(t.id)} target="_blank" rel="noreferrer">
              <div>{t.name}</div>
              <div className="row" style={{ gap: 6, marginTop: 4 }}>
                {t.priority && <span className={`embed-chip ${PRIORITY_COLOR[t.priority] ?? "gray"}`}>{t.priority}</span>}
                <span className="muted">
                  {[t.due ? `Due ${formatDue(t.due)}` : null, t.trackedMin ? formatMinutes(t.trackedMin) : null].filter(Boolean).join(" · ")}
                </span>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
