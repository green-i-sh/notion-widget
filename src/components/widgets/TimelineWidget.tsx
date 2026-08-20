import { useEffect, useState } from "react";
import { fetchTimeline, type TimelineEntry } from "../../services/notion";

const DAY_START = 7; // 07:00
const DAY_END = 23; // 23:00
const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);
const ROW_HEIGHT = 36;
const RANGE_START = DAY_START * 60;
const RANGE_END = (DAY_END + 1) * 60;

/** Notion date properties come back with the workspace's own offset already
 *  embedded (e.g. "...T10:00:00+09:00"), so the local hour/minute can be
 *  read straight off the string instead of re-converting a Date object. */
function minutesFromISO(iso: string): number {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function block(entry: TimelineEntry, totalHeight: number) {
  if (!entry.start) return null;
  const startMin = Math.min(Math.max(minutesFromISO(entry.start), RANGE_START), RANGE_END);
  const endMin = entry.end
    ? Math.min(Math.max(minutesFromISO(entry.end), RANGE_START), RANGE_END)
    : startMin;
  const top = ((startMin - RANGE_START) / (RANGE_END - RANGE_START)) * totalHeight;
  const height = Math.max(((endMin - startMin) / (RANGE_END - RANGE_START)) * totalHeight, 16);
  return { top, height };
}

export function TimelineWidget() {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null);
  const [totalMin, setTotalMin] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTimeline()
      .then((day) => {
        if (cancelled) return;
        setEntries(day.entries);
        setTotalMin(day.totalMin);
      })
      .catch(() => { if (!cancelled) setError("Notion에서 Time Log를 불러오지 못했습니다."); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!entries) return <div className="empty">불러오는 중</div>;

  const totalHeight = HOURS.length * ROW_HEIGHT;

  return (
    <>
      <div className="row">
        <span className="muted">오늘</span>
        <span className="muted" style={{ marginLeft: "auto" }}>합계 {formatMinutes(totalMin)}</span>
      </div>
      <div className="timeline" style={{ height: totalHeight }}>
        {HOURS.map((h) => (
          <div key={h} className="timeline-hour" style={{ height: ROW_HEIGHT }}>
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
        {entries.map((entry) => {
          const pos = block(entry, totalHeight);
          if (!pos) return null;
          return (
            <div
              key={entry.id}
              className="timeline-block"
              style={{ top: pos.top, height: pos.height }}
              title={`${entry.title} · ${formatMinutes(entry.durationMin)}`}
            >
              {entry.title} · {formatMinutes(entry.durationMin)}
            </div>
          );
        })}
      </div>
      {!entries.length && <div className="empty">오늘 기록이 없습니다.</div>}
    </>
  );
}
