import { useState } from "react";
import { useTicker } from "../../hooks/useTicker";
import { hhmmss } from "../../utils/date";

export function StopwatchWidget() {
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const { elapsed, reset } = useTicker(running);

  return (
    <>
      <div className="mono-time">{hhmmss(elapsed / 1000)}</div>
      <div className="row">
        <button type="button" className="btn primary" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" className="btn" onClick={() => setLaps((l) => [...l, elapsed])} disabled={!running}>Lap</button>
        <button type="button" className="btn" onClick={() => { setRunning(false); reset(); setLaps([]); }}>Reset</button>
      </div>
      {laps.length > 0 && (
        <ul className="list">
          {laps.map((lap, i) => (
            <li key={`${lap}-${i}`}>
              <span className="time-col">{i + 1}</span>
              <span className="grow">{hhmmss(lap / 1000)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
