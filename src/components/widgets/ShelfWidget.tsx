import { fetchShelf } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { EmbedRows } from "./shared/EmbedRows";

export function ShelfWidget() {
  const { data, error } = useApiData((opts) => fetchShelf(opts), []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.rows.length) return <div className="empty">읽는 중인 책이나 계획 중인 여행이 없습니다.</div>;

  return <EmbedRows rows={data.rows} />;
}
