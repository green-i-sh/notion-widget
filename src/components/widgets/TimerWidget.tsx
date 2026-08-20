import { useEffect, useState } from "react";
import { useTicker } from "../../hooks/useTicker";
import { hhmmss } from "../../utils/date";

export function TimerWidget() {
  const [minutes, setMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const { elapsed, reset } = useTicker(running);

  const total = Math.max(0, minutes) * 60;
  const remaining = Math.max(0, total - elapsed / 1000);
  const finished = running && remaining <= 0;

  useEffect(() => {
    if (finished) setRunning(false);
  }, [finished]);

  return (
    <>
      <div className="mono-time">{hhmmss(remaining)}</div>
      <div className="row">
        <input
          type="number"
          min={1}
          value={minutes}
          aria-label="타이머 분"
          onChange={(e) => setMinutes(Number(e.target.value) || 0)}
          style={{ maxWidth: 80 }}
        />
        <span className="muted">분</span>
        <button type="button" className="btn primary" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" className="btn" onClick={() => { setRunning(false); reset(); }}>Reset</button>
      </div>
      {remaining === 0 && !running && <div className="muted">시간이 끝났습니다.</div>}
    </>
  );
}
