import { useEffect, useState } from "react";
import { WEEKDAYS_KO } from "../../utils/date";
import { fetchRoutineWeek, toggleRoutine, type Routine, type RoutineDay } from "../../services/notion";

const ROUTINES: Routine[] = ["Exercise", "Reading", "Organizing", "Other"];

export function RoutineWidget() {
  const [days, setDays] = useState<RoutineDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoutineWeek()
      .then((week) => { if (!cancelled) setDays(week.days); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, []);

  const toggle = (day: RoutineDay, routine: Routine) => {
    if (!day.pageId || !day.values) return;
    const next = !day.values[routine];
    setDays((prev) =>
      prev?.map((d) => (d.date === day.date ? { ...d, values: { ...d.values!, [routine]: next } } : d)) ?? prev
    );
    toggleRoutine(day.pageId, routine, next).catch((err) => setError(err instanceof Error ? err.message : String(err)));
  };

  if (error) return <div className="error">{error}</div>;
  if (!days) return <div className="empty">불러오는 중</div>;

  return (
    <>
      <div className="embed-title">Routine Check</div>
      {ROUTINES.map((routine) => {
        const count = days.filter((d) => d.values?.[routine]).length;
        return (
          <div key={routine} className="routine-row">
            <div className="routine-head">
              <span className="routine-chip">{routine}</span>
              <span className="routine-count">{count} / 7</span>
            </div>
            <div className="routine-grid">
              {days.map((day, i) => {
                const on = day.values?.[routine] ?? false;
                if (!day.pageId) {
                  return <button key={day.date} type="button" className="routine-cell" disabled aria-label={`${day.date} 기록 없음`} />;
                }
                return (
                  <button
                    key={day.date}
                    type="button"
                    className={`routine-cell${on ? " on" : ""}`}
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
