import { fetchToday } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { dateParam } from "../../utils/date";
import { EmbedRows } from "./shared/EmbedRows";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function TodayWidget() {
  const date = dateParam();
  const { data: summary, error } = useApiData((opts) => fetchToday(date, opts), [date]);

  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div className="empty">불러오는 중</div>;
  if (!summary.found) return <div className="empty">해당 날짜의 Daily Log가 아직 없습니다.</div>;

  const { tasksDone = 0, tasksTotal = 0, trackedMin = 0, expense = 0, morningPage } = summary;
  const written = morningPage === "작성";

  return (
    <EmbedRows
      rows={[
        { key: "tasks", label: "Tasks 완료", value: `${tasksDone} / ${tasksTotal}` },
        { key: "tracked", label: "Tracked", value: formatMinutes(trackedMin) },
        { key: "expense", label: "Expense", value: `₩${Math.abs(expense).toLocaleString()}` },
        {
          key: "morning",
          label: "Morning Page",
          value: (
            <span className={`embed-chip ${written ? "green" : "gray"}`}>
              {written ? "작성 완료" : morningPage || "미작성"}
            </span>
          ),
        },
      ]}
    />
  );
}
