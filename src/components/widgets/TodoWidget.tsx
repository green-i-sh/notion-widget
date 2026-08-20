import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import type { TodoItem } from "../../types";
import { uid } from "../../utils/id";

const PRIORITY_ORDER: Record<TodoItem["priority"], number> = { high: 0, normal: 1, low: 2 };
const PRIORITY_LABEL: Record<TodoItem["priority"], string> = { high: "높음", normal: "보통", low: "낮음" };

export function TodoWidget() {
  const { data } = useAppState();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoItem["priority"]>("normal");

  const todos = [...data.todos].sort(
    (a, b) => Number(a.done) - Number(b.done) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
  const doneCount = todos.filter((t) => t.done).length;
  const rate = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

  const add = () => {
    const label = title.trim();
    if (!label) return;
    actions.setData("todos", [...data.todos, { id: uid(), title: label, done: false, priority, date: null }]);
    setTitle("");
  };

  const patch = (id: string, next: Partial<TodoItem>) =>
    actions.setData("todos", data.todos.map((t) => (t.id === id ? { ...t, ...next } : t)));

  return (
    <>
      <div className="row">
        <span className="muted">{doneCount} / {todos.length}</span>
        <span className="muted" style={{ marginLeft: "auto" }}>{rate}%</span>
      </div>
      <div className="bar"><span style={{ width: `${rate}%` }} /></div>

      <ul className="list">
        {todos.map((t) => (
          <li key={t.id}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => patch(t.id, { done: !t.done })}
              aria-label={`${t.title} 완료`}
            />
            <span className={`grow${t.done ? " done-text" : ""}`}>{t.title}</span>
            <span className="muted">{PRIORITY_LABEL[t.priority]}</span>
            <button
              type="button"
              className="btn ghost"
              aria-label={`${t.title} 삭제`}
              onClick={() => actions.setData("todos", data.todos.filter((x) => x.id !== t.id))}
            >✕</button>
          </li>
        ))}
        {!todos.length && <li className="empty">할 일을 추가해 보세요.</li>}
      </ul>

      <div className="row">
        <input value={title} placeholder="할 일" aria-label="할 일" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <select value={priority} aria-label="우선순위" onChange={(e) => setPriority(e.target.value as TodoItem["priority"])} style={{ maxWidth: 90 }}>
          <option value="high">높음</option>
          <option value="normal">보통</option>
          <option value="low">낮음</option>
        </select>
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </>
  );
}
