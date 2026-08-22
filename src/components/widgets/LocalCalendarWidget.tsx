import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { monthGrid, todayISO, WEEKDAYS_KO } from "../../utils/date";
import { uid } from "../../utils/id";

const DOW = [1, 2, 3, 4, 5, 6, 0].map((i) => WEEKDAYS_KO[i]);

/** Local, non-Notion month calendar for the dashboard grid — backed by the
 *  browser-stored `schedule` list, not Notion. Not part of WIDGET-SPEC.md;
 *  distinct from the Notion Life-photo calendar at ?w=calendar. */
export function LocalCalendarWidget() {
  const { data } = useAppState();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(today);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");

  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const marked = new Set(data.schedule.map((s) => s.date));
  const dayItems = data.schedule
    .filter((s) => s.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));

  const shift = (delta: number) => {
    const next = new Date(cursor);
    next.setMonth(cursor.getMonth() + delta, 1);
    setCursor(next);
  };

  const add = () => {
    const label = title.trim();
    if (!label) return;
    actions.setData("schedule", [
      ...data.schedule,
      { id: uid(), date: selected, time, title: label },
    ]);
    setTitle("");
  };

  return (
    <>
      <div className="cal-head">
        <span className="cal-title">
          {cursor.getFullYear()}.{`${cursor.getMonth() + 1}`.padStart(2, "0")}
        </span>
        <div style={{ marginLeft: "auto" }} className="row">
          <button type="button" className="btn ghost" onClick={() => shift(-1)} aria-label="이전 달">←</button>
          <button type="button" className="btn ghost" onClick={() => { setCursor(new Date()); setSelected(today); }}>오늘</button>
          <button type="button" className="btn ghost" onClick={() => shift(1)} aria-label="다음 달">→</button>
        </div>
      </div>

      <div className="cal-grid" role="grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((iso, i) => (
          <button
            key={iso ?? `pad-${i}`}
            type="button"
            className={[
              "cal-cell",
              iso === today ? "today" : "",
              iso === selected ? "selected" : "",
            ].filter(Boolean).join(" ")}
            disabled={!iso}
            onClick={() => iso && setSelected(iso)}
            aria-label={iso ?? undefined}
          >
            {iso ? Number(iso.slice(8)) : ""}
            {iso && marked.has(iso) && <span className="dot" />}
          </button>
        ))}
      </div>

      <div className="muted">{selected}</div>
      <ul className="list">
        {dayItems.map((s) => (
          <li key={s.id}>
            <span className="time-col">{s.time}</span>
            <span className="grow">{s.title}</span>
            <button
              type="button"
              className="btn ghost"
              aria-label={`${s.title} 삭제`}
              onClick={() => actions.setData("schedule", data.schedule.filter((x) => x.id !== s.id))}
            >✕</button>
          </li>
        ))}
        {!dayItems.length && <li className="empty">일정이 없습니다.</li>}
      </ul>

      <div className="row">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="시간" style={{ maxWidth: 110 }} />
        <input
          value={title}
          placeholder="일정 추가"
          aria-label="일정 제목"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </>
  );
}
