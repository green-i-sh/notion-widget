import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { useAddForm } from "../../hooks/useAddForm";
import type { ProgressItem } from "../../types";
import { uid } from "../../utils/id";

export function ProgressWidget() {
  const { data } = useAppState();
  const { open, show, hide } = useAddForm();
  const [title, setTitle] = useState("");

  const add = () => {
    const label = title.trim();
    if (!label) return;
    actions.setData("progress", [
      ...data.progress,
      { id: uid(), title: label, current: 0, target: 100, unit: "" },
    ]);
    setTitle("");
  };

  const patch = (id: string, next: Partial<ProgressItem>) =>
    actions.setData("progress", data.progress.map((p) => (p.id === id ? { ...p, ...next } : p)));

  const toNumber = (raw: string) => {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <>
      {data.progress.map((p) => {
        const pct = p.target > 0 ? Math.min(100, Math.round((p.current / p.target) * 100)) : 0;
        return (
          <div key={p.id} style={{ paddingBottom: 10 }}>
            <div className="row">
              <span className="grow">{p.title}</span>
              <span className="muted">{pct}%</span>
              <button type="button" className="btn ghost" aria-label={`${p.title} 삭제`} onClick={() => actions.setData("progress", data.progress.filter((x) => x.id !== p.id))}>✕</button>
            </div>
            <div className="bar"><span style={{ width: `${pct}%` }} /></div>
            <div className="row" style={{ marginTop: 6 }}>
              <input type="number" value={p.current} aria-label={`${p.title} 현재값`} onChange={(e) => patch(p.id, { current: toNumber(e.target.value) })} />
              <span className="muted">/</span>
              <input type="number" value={p.target} aria-label={`${p.title} 목표값`} onChange={(e) => patch(p.id, { target: toNumber(e.target.value) })} />
              <input value={p.unit} placeholder="단위" aria-label={`${p.title} 단위`} onChange={(e) => patch(p.id, { unit: e.target.value })} style={{ maxWidth: 70 }} />
            </div>
          </div>
        );
      })}
      {!data.progress.length && <div className="empty">목표를 추가해 보세요.</div>}
      {open ? (
        <div className="row">
          <input value={title} placeholder="목표 이름" aria-label="목표 이름" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button type="button" className="btn" onClick={add}>추가</button>
          <button type="button" className="btn ghost" aria-label="입력 닫기" onClick={hide}>✕</button>
        </div>
      ) : (
        <button type="button" className="btn add-toggle" onClick={show}>+ 추가</button>
      )}
    </>
  );
}
