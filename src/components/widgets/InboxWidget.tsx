import { fetchInbox } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { notionUrl } from "../../utils/notionUrl";

const PRIORITY_COLOR: Record<string, string> = { Highest: "pink", Medium: "yellow", Lowest: "gray" };

export function InboxWidget() {
  const { data, error } = useApiData((opts) => fetchInbox(opts), []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.tasks.length) return <div className="empty-box">받은 것이 없습니다</div>;

  return (
    <>
      <ul className="list">
        {data.tasks.map((t) => (
          <li key={t.id}>
            <a className="grow plain-link" href={notionUrl(t.id)} target="_blank" rel="noreferrer">{t.name}</a>
            {t.status && <span className="embed-chip lav">{t.status}</span>}
            {t.priority && <span className={`embed-chip ${PRIORITY_COLOR[t.priority] ?? "gray"}`}>{t.priority}</span>}
            {t.context.map((c) => (
              <span key={c} className="embed-chip gray">{c}</span>
            ))}
            {t.when && <span className="muted">{t.when}</span>}
          </li>
        ))}
      </ul>
      <div className="row">
        <span className="muted" style={{ marginLeft: "auto" }}>Inbox {data.tasks.length}</span>
      </div>
    </>
  );
}
