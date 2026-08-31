import { useState } from "react";
import { fetchFixed, applyFixed, type FixedItem } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";

const COLOR_CYCLE = ["lav", "purple", "green", "gray", "pink", "yellow"];

function colorFor(index: number): string {
  return COLOR_CYCLE[index % COLOR_CYCLE.length];
}

function won(n: number): string {
  return `₩${Math.round(Math.abs(n)).toLocaleString()}`;
}

export function FixedWidget() {
  const { data, error, refresh } = useApiData(fetchFixed, []);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.items.length) return <div className="empty">활성화된 고정지출이 없습니다.</div>;

  const allReflected = data.items.every((i) => i.reflected);
  const total = data.items.reduce((sum, i) => {
    if (i.reflected) return sum;
    const amount = i.variable ? Number(amounts[i.id]) || 0 : i.amount;
    return sum + amount;
  }, 0);

  const apply = async () => {
    setApplying(true);
    setApplyError(null);
    setResultMsg(null);
    const payload: Record<string, number> = {};
    for (const item of data.items) {
      if (item.variable && amounts[item.id]) payload[item.id] = Number(amounts[item.id]);
    }
    try {
      const result = await applyFixed(payload);
      setResultMsg(`${result.created}건 반영, ${result.skipped}건 건너뜀`);
      await refresh({ bust: true });
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      {applyError && <div className="error">{applyError}</div>}
      <ul className="list">
        {data.items.map((item: FixedItem, i: number) => (
          <li key={item.id}>
            <span className="grow">{item.name}</span>
            <span className={`embed-chip ${colorFor(i)}`}>{item.type}</span>
            {item.variable ? (
              <input
                type="number"
                className="fixed-amount-input"
                placeholder="금액"
                value={amounts[item.id] ?? ""}
                disabled={item.reflected}
                onChange={(e) => setAmounts((a) => ({ ...a, [item.id]: e.target.value }))}
              />
            ) : (
              <span className="muted">{won(item.amount)}</span>
            )}
            <span className="muted">매월 {item.dueDay}일</span>
            {item.remaining && <span className="muted">{item.remaining}</span>}
            <span className={`fixed-dot${item.reflected ? " done" : ""}`}>{item.reflected ? "✓" : "•"}</span>
          </li>
        ))}
      </ul>
      <div className="fixed-foot">
        <span>
          합계 <strong>{won(total)}</strong>
          {resultMsg && <span className="muted"> · {resultMsg}</span>}
        </span>
        <button type="button" className="btn primary" disabled={allReflected || applying} onClick={apply}>
          {allReflected ? "이번 달 반영 완료" : "이번 달 넣기"}
        </button>
      </div>
    </>
  );
}
