import { fetchReview, type ReviewType } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { EmbedStats } from "./shared/EmbedStats";

function typeParam(): ReviewType {
  return new URLSearchParams(window.location.search).get("type") === "quarterly" ? "quarterly" : "monthly";
}

export function ReviewWidget() {
  const type = typeParam();
  const { data, error } = useApiData((opts) => fetchReview(type, opts), [type]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.found) return <div className="empty">{data.type} Review가 아직 없습니다.</div>;

  return <EmbedStats stats={data.stats} />;
}
