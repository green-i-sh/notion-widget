import { fetchMeta, type MetaKind } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";

const KINDS: MetaKind[] = ["today", "finance", "life", "books", "bingo"];

function kindParam(): MetaKind {
  const v = new URLSearchParams(window.location.search).get("kind");
  return (KINDS as string[]).includes(v ?? "") ? (v as MetaKind) : "today";
}

export function MetaWidget() {
  const kind = kindParam();
  const { data, error } = useApiData((opts) => fetchMeta(kind, opts), [kind]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  return <div className="meta-line">{data.text}</div>;
}
