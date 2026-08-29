import { useEffect, useState } from "react";
import { fetchTasks, runTaskAction, type TaskItem, type TaskAction } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { hhmmss } from "../../utils/date";

const PRIORITY_COLOR: Record<string, string> = { Highest: "pink", Medium: "yellow", Lowest: "gray" };

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function TasksWidget() {
  const { data, error, refresh } = useApiData((opts) => fetchTasks(undefined, opts), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  // Notion's date properties only store minute precision, and start/pause
  // both round-trip a network call before the server's view updates — so a
  // plain "read active.start back from the server" timer visibly starts
  // partway into a minute and takes a beat to appear. Track our own click
  // moment here (full precision, instant) and only fall back to the
  // server's value on a fresh load, where restoring from *some* value beats
  // showing nothing — see the reconcile effect below.
  const [optimistic, setOptimistic] = useState<{ taskId: string; start: string } | null>(null);

  const serverActive = data?.active ?? null;
  const active = optimistic ?? serverActive;

  useEffect(() => {
    if (optimistic && (!serverActive || serverActive.taskId !== optimistic.taskId)) setOptimistic(null);
  }, [optimistic, serverActive]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
    // Only taskId/start identify a run — a plain `active` dep would restart
    // the interval on every 60s poll even when nothing changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.taskId, active?.start]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  const activeTask = active ? data.tasks.find((t) => t.id === active.taskId) : undefined;
  const elapsed = active ? Math.max(0, Math.floor((Date.now() - new Date(active.start).getTime()) / 1000)) : 0;
  void tick; // re-render every second while a task is running

  const act = async (action: TaskAction, task: TaskItem) => {
    setActionError(null);
    setOptimistic(action === "start" ? { taskId: task.id, start: new Date().toISOString() } : null);
    setBusy(task.id);
    try {
      await runTaskAction(action, task.id);
      await refresh({ bust: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setOptimistic(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {actionError && <div className="error">{actionError}</div>}
      <div className="tasks-head">
        <span className={`tasks-timer${active ? " running" : ""}`}>
          {active ? `${hhmmss(elapsed)} · ${activeTask?.name ?? ""}` : "00:00:00 대기 중"}
        </span>
      </div>

      <ul className="list">
        {data.tasks.map((task) => {
          const isActive = active?.taskId === task.id;
          return (
            <li key={task.id} className={`tasks-row${isActive ? " active" : ""}`}>
              <span className={`grow${task.done ? " done-text" : ""}`}>{task.name}</span>
              {task.priority && <span className={`embed-chip ${PRIORITY_COLOR[task.priority] ?? "gray"}`}>{task.priority}</span>}
              {task.context.map((c) => (
                <span key={c} className="embed-chip gray">{c}</span>
              ))}
              <span className="muted">{formatMinutes(task.trackedMin)}</span>
              {!task.done && (
                <span className="row" style={{ gap: 4 }}>
                  <button type="button" className="btn ghost tiny" disabled={busy === task.id} aria-label={`${task.name} 시작`} onClick={() => act("start", task)}>▷</button>
                  <button type="button" className="btn ghost tiny" disabled={busy === task.id} aria-label={`${task.name} 일시정지`} onClick={() => act("pause", task)}>⏸</button>
                  <button type="button" className="btn ghost tiny" disabled={busy === task.id} aria-label={`${task.name} 완료`} onClick={() => act("done", task)}>■</button>
                </span>
              )}
            </li>
          );
        })}
        {!data.tasks.length && <li className="empty">오늘 마감인 Task가 없습니다.</li>}
      </ul>
    </>
  );
}
