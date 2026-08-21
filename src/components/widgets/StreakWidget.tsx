import { fetchStreak } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { EmbedRows } from "./shared/EmbedRows";

export function StreakWidget() {
  const { data, error } = useApiData((opts) => fetchStreak(opts), []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  return (
    <EmbedRows
      rows={[{ key: "streak", label: `Month ${data.month}`, value: `기록 ${data.streakDays}일 연속` }]}
    />
  );
}
