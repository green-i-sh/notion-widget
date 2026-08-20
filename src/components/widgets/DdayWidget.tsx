import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { daysUntil, todayISO } from "../../utils/date";
import { uid } from "../../utils/id";

/** D-3 / D-DAY / D+12 for a target date. */
function label(iso: string): string {
  const diff = daysUntil(iso);
  if (diff === null) return "날짜 오류";
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

export function DdayWidget() {
  const { data } = useAppState();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());

  const add = () => {
    const name = title.trim();
    if (!name || !daysUntil(date)) {
      if (!name) return;
    }
    actions.setData("ddays", [...data.ddays, { id: uid(), title: name, date }]);
    setTitle("");
  };

  return (
    <>
      <ul className="list">
        {data.ddays.map((d) => (
          <li key={d.id}>
            <div className="grow">
              <div>{d.title}</div>
              <div className="muted">{d.date}</div>
            </div>
            <span className="dday-num">{label(d.date)}</span>
            <button
              type="button"
              className="btn ghost"
              aria-label={`${d.title} 삭제`}
              onClick={() => actions.setData("ddays", data.ddays.filter((x) => x.id !== d.id))}
            >✕</button>
          </li>
        ))}
        {!data.ddays.length && <li className="empty">기념일을 추가해 보세요.</li>}
      </ul>
      <div className="row">
        <input value={title} placeholder="제목" aria-label="D-Day 제목" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="D-Day 날짜" style={{ maxWidth: 140 }} />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </>
  );
}
