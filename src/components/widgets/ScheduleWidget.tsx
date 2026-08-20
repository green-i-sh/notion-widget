import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { todayISO } from "../../utils/date";
import { uid } from "../../utils/id";

export function ScheduleWidget() {
  const { data } = useAppState();
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const items = data.schedule
    .filter((s) => s.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  const add = () => {
    const label = title.trim();
    if (!label) return;
    actions.setData("schedule", [...data.schedule, { id: uid(), date, time, title: label }]);
    setTitle("");
  };

  const patch = (id: string, next: Partial<{ time: string; title: string }>) => {
    actions.setData("schedule", data.schedule.map((s) => (s.id === id ? { ...s, ...next } : s)));
  };

  return (
    <>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="날짜" />
      <ul className="list">
        {items.map((s) => (
          <li key={s.id}>
            {editing === s.id ? (
              <>
                <input type="time" value={s.time} onChange={(e) => patch(s.id, { time: e.target.value })} style={{ maxWidth: 100 }} aria-label="시간 수정" />
                <input value={s.title} onChange={(e) => patch(s.id, { title: e.target.value })} aria-label="제목 수정" />
                <button type="button" className="btn tiny" onClick={() => setEditing(null)}>완료</button>
              </>
            ) : (
              <>
                <span className="time-col">{s.time}</span>
                <span className="grow">{s.title}</span>
                <button type="button" className="btn ghost" onClick={() => setEditing(s.id)} aria-label={`${s.title} 수정`}>수정</button>
                <button type="button" className="btn ghost" onClick={() => actions.setData("schedule", data.schedule.filter((x) => x.id !== s.id))} aria-label={`${s.title} 삭제`}>✕</button>
              </>
            )}
          </li>
        ))}
        {!items.length && <li className="empty">이 날짜에 일정이 없습니다.</li>}
      </ul>
      <div className="row">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="새 일정 시간" style={{ maxWidth: 110 }} />
        <input value={title} placeholder="일정" aria-label="새 일정 제목" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </>
  );
}
