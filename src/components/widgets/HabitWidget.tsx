import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { WEEKDAYS_KO, parseISODate, todayISO, weekDates } from "../../utils/date";
import { uid } from "../../utils/id";

/** Longest run of consecutive days ending on the most recent check. */
function streak(done: string[]): number {
  if (!done.length) return 0;
  const sorted = [...done].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = parseISODate(sorted[i - 1]);
    const curr = parseISODate(sorted[i]);
    if (!prev || !curr) continue;
    const gap = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export function HabitWidget() {
  const { data } = useAppState();
  const [name, setName] = useState("");
  const week = weekDates();
  const today = todayISO();

  const add = () => {
    const label = name.trim();
    if (!label) return;
    actions.setData("habits", [...data.habits, { id: uid(), name: label, done: [] }]);
    setName("");
  };

  return (
    <>
      {data.habits.map((h) => {
        const count = week.filter((d) => h.done.includes(d)).length;
        return (
          <div key={h.id} className="habit-row">
            <div>
              <div>{h.name}</div>
              <div className="muted">{count} / 7 · 연속 {streak(h.done)}일</div>
            </div>
            <div className="habit-cells">
              {week.map((iso, i) => {
                const on = h.done.includes(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`habit-cell${on ? " on" : ""}`}
                    aria-pressed={on}
                    aria-label={`${h.name} ${iso}`}
                    title={iso === today ? "오늘" : iso}
                    onClick={() => actions.toggleHabit(h.id, iso)}
                  >
                    {on ? "✓" : WEEKDAYS_KO[(i + 1) % 7]}
                  </button>
                );
              })}
              <button
                type="button"
                className="btn ghost"
                aria-label={`${h.name} 삭제`}
                onClick={() => actions.setData("habits", data.habits.filter((x) => x.id !== h.id))}
              >✕</button>
            </div>
          </div>
        );
      })}
      {!data.habits.length && <div className="empty">루틴을 추가해 보세요.</div>}
      <div className="row">
        <input value={name} placeholder="루틴 이름" aria-label="루틴 이름" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </>
  );
}
