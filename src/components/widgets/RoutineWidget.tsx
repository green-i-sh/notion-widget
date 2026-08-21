import { useState } from "react";
import { WEEKDAYS_KO, dateParam } from "../../utils/date";
import { fetchRoutineWeek, toggleRoutine, type Routine, type RoutineDay } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";

const ROUTINES: Routine[] = ["Exercise", "Reading", "Organizing", "Other"];
const ROUTINE_COLOR: Record<Routine, string> = {
  Exercise: "lav",
  Reading: "purple",
  Organizing: "green",
  Other: "gray",
};

export function RoutineWidget() {
  const date = dateParam();
  const { data: week, error, refresh } = useApiData((opts) => fetchRoutineWeek(date, opts), [date]);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);

  if (error) return <div className="error">{error}</div>;
  if (!week) return <div className="empty">불러오는 중</div>;

  const toggle = async (day: RoutineDay, routine: Routine) => {
    if (!day.pageId || !day.values) return;
    const key = `${day.date}:${routine}`;
    const next = !day.values[routine];
    setToggleError(null);
    setPending((p) => ({ ...p, [key]: next }));
    try {
      await toggleRoutine(day.pageId, routine, next);
      await refresh({ bust: true });
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending((p) => {
        const rest = { ...p };
        delete rest[key];
        return rest;
      });
    }
  };

  return (
    <>
      {toggleError && <div className="error">{toggleError}</div>}
      {ROUTINES.map((routine) => {
        const color = ROUTINE_COLOR[routine];
        const count = week.days.filter((d) => pending[`${d.date}:${routine}`] ?? d.values?.[routine]).length;
        return (
          <div key={routine} className="routine-row">
            <div className="routine-head">
              <span className={`embed-chip ${color}`}>{routine}</span>
              <span className="routine-count">{count} / 7</span>
            </div>
            <div className="routine-grid">
              {week.days.map((day, i) => {
                const key = `${day.date}:${routine}`;
                const on = pending[key] ?? day.values?.[routine] ?? false;
                if (!day.pageId) {
                  return <button key={day.date} type="button" className="routine-cell" disabled aria-label={`${day.date} 기록 없음`} />;
                }
                return (
                  <button
                    key={day.date}
                    type="button"
                    className={`routine-cell${on ? ` on ${color}` : ""}`}
                    aria-pressed={on}
                    aria-label={`${routine} ${day.date}`}
                    onClick={() => toggle(day, routine)}
                  >
                    {on ? "✓" : WEEKDAYS_KO[(i + 1) % 7]}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
