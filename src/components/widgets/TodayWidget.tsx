import { useEffect, useState } from "react";
import { fetchToday, type TodaySummary } from "../../services/notion";

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
      .catch(() => { if (!cancelled) setError("Notion에서 오늘 기록을 불러오지 못했습니다."); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div className="empty">불러오는 중</div>;
  if (!summary.found) return <div className="empty">오늘 Daily Log가 아직 없습니다.</div>;

  const { tasksDone = 0, tasksTotal = 0, trackedMin = 0, expense = 0, morningPage } = summary;
  const pct = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  return (
    <>
      <div className="row">
        <span className="muted">Tasks</span>
        <span style={{ marginLeft: "auto" }}>{tasksDone} / {tasksTotal}</span>
      </div>
      <div className="bar"><span style={{ width: `${pct}%` }} /></div>
      <div className="row">
        <span className="muted">Tracked</span>
        <span style={{ marginLeft: "auto" }}>{formatMinutes(trackedMin)}</span>
      </div>
      <div className="row">
        <span className="muted">Expense</span>
        <span style={{ marginLeft: "auto" }}>₩{Math.abs(expense).toLocaleString()}</span>
      </div>
      <div className="row">
        <span className="muted">Morning Page</span>
        <span style={{ marginLeft: "auto" }}>{morningPage || "—"}</span>
      </div>
    </>
  );
}
