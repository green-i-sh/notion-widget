import { useState } from "react";
import { fetchBingo, toggleBingo, type BingoBoard, type BingoItem } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";

function boardParam(): BingoBoard {
  return new URLSearchParams(window.location.search).get("board") === "quarterly" ? "quarterly" : "monthly";
}

export function BingoWidget() {
  const board = boardParam();
  const { data, error, refresh } = useApiData((opts) => fetchBingo(board, opts), [board]);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.items.length) return <div className="empty">Bingo 보드가 아직 없습니다.</div>;

  const toggle = async (item: BingoItem) => {
    const next = !(pending[item.id] ?? item.done);
    setToggleError(null);
    setPending((p) => ({ ...p, [item.id]: next }));
    try {
      await toggleBingo(item.id, next);
      await refresh({ bust: true });
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending((p) => {
        const rest = { ...p };
        delete rest[item.id];
        return rest;
      });
    }
  };

  const done = data.items.filter((i) => pending[i.id] ?? i.done).length;
  const shown = data.items.slice(0, 9);

  return (
    <>
      {toggleError && <div className="error">{toggleError}</div>}
      <div className="muted">Done {done} / {data.items.length}</div>
      <div className="bingo-grid">
        {shown.map((item, i) => {
          const checked = pending[item.id] ?? item.done;
          return (
            <div key={item.id} className={`bingo-card${checked ? " done" : ""}`}>
              <div className="bingo-no">{String(i + 1).padStart(2, "0")}</div>
              <div className="bingo-body">
                <div className="bingo-title">{item.name}</div>
                <span className={`embed-chip ${checked ? "green" : "gray"}`}>{checked ? "Done" : "미완료"}</span>
                <input type="checkbox" checked={checked} onChange={() => toggle(item)} aria-label={item.name} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
