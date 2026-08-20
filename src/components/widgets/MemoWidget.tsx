import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { uid } from "../../utils/id";

export function MemoWidget() {
  const { data } = useAppState();
  const [activeId, setActiveId] = useState<string | null>(data.memos[0]?.id ?? null);

  const active = data.memos.find((m) => m.id === activeId) ?? null;

  const create = () => {
    const memo = { id: uid(), title: "새 메모", body: "", updatedAt: Date.now() };
    actions.setData("memos", [memo, ...data.memos]);
    setActiveId(memo.id);
  };

  const patch = (next: Partial<{ title: string; body: string }>) => {
    if (!active) return;
    actions.setData(
      "memos",
      data.memos.map((m) => (m.id === active.id ? { ...m, ...next, updatedAt: Date.now() } : m))
    );
  };

  const remove = () => {
    if (!active) return;
    const rest = data.memos.filter((m) => m.id !== active.id);
    actions.setData("memos", rest);
    setActiveId(rest[0]?.id ?? null);
  };

  return (
    <>
      <div className="row">
        <select
          value={active?.id ?? ""}
          aria-label="메모 선택"
          onChange={(e) => setActiveId(e.target.value || null)}
        >
          {!data.memos.length && <option value="">메모 없음</option>}
          {data.memos.map((m) => (
            <option key={m.id} value={m.id}>{m.title || "제목 없음"}</option>
          ))}
        </select>
        <button type="button" className="btn tiny" onClick={create}>새로</button>
        {active && <button type="button" className="btn tiny" onClick={remove}>삭제</button>}
      </div>

      {active ? (
        <>
          <input value={active.title} aria-label="메모 제목" onChange={(e) => patch({ title: e.target.value })} />
          <textarea
            value={active.body}
            aria-label="메모 내용"
            rows={5}
            placeholder="입력하면 자동으로 저장됩니다."
            onChange={(e) => patch({ body: e.target.value })}
          />
        </>
      ) : (
        <div className="empty">메모를 만들어 보세요.</div>
      )}
    </>
  );
}
