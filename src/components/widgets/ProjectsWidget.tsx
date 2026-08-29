import { fetchProjects } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { EmbedRows, type EmbedRowItem } from "./shared/EmbedRows";
import { notionUrl } from "../../utils/notionUrl";

function formatDue(due: string | null): string {
  return due ? due.slice(5).replace("-", ".") : "—";
}

function link(id: string, name: string) {
  return (
    <a className="plain-link" href={notionUrl(id)} target="_blank" rel="noreferrer">
      {name}
    </a>
  );
}

/** Spec: a category with zero items still shows one "—" row, not a collapsed blank. */
function rowsOrEmpty(rows: EmbedRowItem[]): EmbedRowItem[] {
  return rows.length ? rows : [{ key: "empty", label: "—", value: "" }];
}

export function ProjectsWidget() {
  const { data, error } = useApiData((opts) => fetchProjects(opts), []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  const columns: { key: string; title: string; rows: EmbedRowItem[] }[] = [
    {
      key: "projects",
      title: "Projects",
      rows: data.projects.map((p) => ({ key: p.id, label: link(p.id, p.name), value: `${p.subCount} sub` })),
    },
    {
      key: "waiting",
      title: "Waiting For",
      rows: data.waiting.map((w) => ({ key: w.id, label: link(w.id, w.name), value: formatDue(w.due) })),
    },
    {
      key: "someday",
      title: "Someday / Reference",
      rows: data.someday.map((s) => ({ key: s.id, label: link(s.id, s.name), value: s.status })),
    },
  ];

  return (
    <div className="trip-cols">
      {columns.map((col) => (
        <div key={col.key} className="trip-col">
          <div className="widget-title">{col.title}</div>
          <EmbedRows rows={rowsOrEmpty(col.rows)} />
        </div>
      ))}
    </div>
  );
}
