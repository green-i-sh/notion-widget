import { fetchLife } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { monthParam } from "../../utils/date";
import { EmbedStats } from "./shared/EmbedStats";

export function LifeWidget() {
  const month = monthParam();
  const { data, error } = useApiData((opts) => fetchLife(month, opts), [month]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  return (
    <EmbedStats
      stats={data.stats.map((s) => ({
        key: s.key,
        label: s.label,
        value: String(s.count),
        caption: s.names.join(" · ") || "—",
      }))}
    />
  );
}
