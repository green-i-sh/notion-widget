import { fetchTimeline, type TimelineEntry } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { dateParam, pad2 } from "../../utils/date";

const DAY_START = 7; // 07:00
const DAY_END = 23; // 23:00
const RANGE_START = DAY_START * 60;
const RANGE_END = DAY_END * 60;
const TICK_HOURS = [7, 10, 13, 16, 19, 22];

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

function clamp(min: number): number {
  return Math.min(Math.max(min, RANGE_START), RANGE_END);
}

function block(entry: TimelineEntry): { left: number; width: number } | null {
  if (!entry.start) return null;
  const startMin = clamp(minutesFromISO(entry.start));
  const endMin = entry.end ? clamp(minutesFromISO(entry.end)) : startMin;
  const span = RANGE_END - RANGE_START;
  const left = ((startMin - RANGE_START) / span) * 100;
  const width = Math.max(((endMin - startMin) / span) * 100, 1.2);
  return { left, width };
}

export function TimelineWidget() {
  const date = dateParam();
  const { data: day, error } = useApiData((opts) => fetchTimeline(date, opts), [date]);

  if (error) return <div className="error">{error}</div>;
  if (!day) return <div className="empty">불러오는 중</div>;

  const entries: TimelineEntry[] = day.entries;
  const totalMin = day.totalMin;

  return (
    <>
      <div className="row">
        <span className="muted">오늘</span>
        <span className="muted" style={{ marginLeft: "auto" }}>합계 {formatMinutes(totalMin)}</span>
      </div>
      <div className="timeline-h">
        <div className="timeline-h-track">
          {entries.map((entry, i) => {
            const pos = block(entry);
            if (!pos) return null;
            return (
              <div
                key={entry.id}
                className={`timeline-h-block ${i % 2 ? "green" : "lav"}`}
                style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                title={`${entry.title} · ${formatMinutes(entry.durationMin)}`}
              >
                {entry.title} {formatMinutes(entry.durationMin)}
              </div>
            );
          })}
        </div>
        <div className="timeline-h-ticks">
          {TICK_HOURS.map((h) => (
            <span
              key={h}
              className="timeline-h-tick"
              style={{ left: `${((h * 60 - RANGE_START) / (RANGE_END - RANGE_START)) * 100}%` }}
            >
              {pad2(h)}:00
            </span>
          ))}
        </div>
      </div>
      {!entries.length && <div className="empty">오늘 기록이 없습니다.</div>}
    </>
  );
}
