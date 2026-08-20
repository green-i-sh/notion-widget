import { useEffect, useState } from "react";
import { fetchToday, type TodaySummary } from "../../services/notion";
import { EmbedRows } from "./shared/EmbedRows";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function TodayWidget() {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchToday()
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div className="empty">불러오는 중</div>;
  if (!summary.found) return <div className="empty">오늘 Daily Log가 아직 없습니다.</div>;

  const { tasksDone = 0, tasksTotal = 0, trackedMin = 0, expense = 0, morningPage } = summary;
  const written = morningPage === "작성";

  return (
    <>
      <div className="embed-title">Today · Monitoring</div>
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
    </>
  );
}
