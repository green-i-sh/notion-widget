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
      .catch(() => { if (!cancelled) setError("Notion에서 루틴을 불러오지 못했습니다."); });
    return () => { cancelled = true; };
  }, []);

  const toggle = (day: RoutineDay, routine: Routine) => {
    if (!day.pageId || !day.values) return;
    const next = !day.values[routine];
    setDays((prev) =>
      prev?.map((d) => (d.date === day.date ? { ...d, values: { ...d.values!, [routine]: next } } : d)) ?? prev
    );
    toggleRoutine(day.pageId, routine, next).catch(() => setError("저장하지 못했습니다."));
  };

  if (error) return <div className="error">{error}</div>;
  if (!days) return <div className="empty">불러오는 중</div>;

  return (
    <>
      {ROUTINES.map((routine) => (
        <div key={routine} className="habit-row">
          <div>{routine}</div>
          <div className="habit-cells">
            {days.map((day, i) => {
              const on = day.values?.[routine] ?? false;
              if (!day.pageId) {
                return <button key={day.date} type="button" className="habit-cell" disabled aria-label={`${day.date} 기록 없음`} />;
              }
              return (
                <button
                  key={day.date}
                  type="button"
                  className={`habit-cell${on ? " on" : ""}`}
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
      ))}
    </>
  );
}
