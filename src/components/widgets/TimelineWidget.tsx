import { fetchTimeline, type TimelineEntry } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { dateParam, pad2 } from "../../utils/date";

const DAY_START = 7; // 07:00
const DAY_END = 23; // 23:00
const RANGE_START = DAY_START * 60;
const RANGE_END = DAY_END * 60;
const HOUR_PX = 28; // (DAY_END - DAY_START) * HOUR_PX = 448px, matches the ~450px spec
const PX_PER_MIN = HOUR_PX / 60;
const TRACK_HEIGHT = (RANGE_END - RANGE_START) * PX_PER_MIN;
const MIN_BLOCK_HEIGHT = 4;
const MIN_HEIGHT_FOR_LABEL = 16;

const HOUR_MARKS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);
const HALF_HOUR_MARKS = Array.from({ length: (DAY_END - DAY_START) * 2 }, (_, i) => RANGE_START + i * 30);

// Stable but arbitrary-looking spread across the pastel chip palette (WIDGET-SPEC §0)
// so different tasks land on visibly different colors without any server-side task lookup.
const PALETTE = ["lav", "purple", "green", "pink", "yellow", "gray"] as const;
function colorFor(title: string): (typeof PALETTE)[number] {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash * 31 + title.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
}

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

function block(entry: TimelineEntry): { top: number; height: number } | null {
  if (!entry.start) return null;
  const startMin = clamp(minutesFromISO(entry.start));
  const endMin = entry.end ? clamp(minutesFromISO(entry.end)) : startMin;
  const top = (startMin - RANGE_START) * PX_PER_MIN;
  const height = Math.max((endMin - startMin) * PX_PER_MIN, MIN_BLOCK_HEIGHT);
  return { top, height };
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
      <div className="timeline-body" style={{ height: `${TRACK_HEIGHT}px` }}>
        <div className="timeline-ticks">
          {HOUR_MARKS.map((h) => (
            <span key={h} className="timeline-tick" style={{ top: `${(h * 60 - RANGE_START) * PX_PER_MIN}px` }}>
              {pad2(h)}
            </span>
          ))}
        </div>
        <div className="timeline-track">
          {HALF_HOUR_MARKS.map((m) => (
            <div
              key={m}
              className={`timeline-gridline${m % 60 === 0 ? " hour" : ""}`}
              style={{ top: `${(m - RANGE_START) * PX_PER_MIN}px` }}
            />
          ))}
          {entries.map((entry) => {
            const pos = block(entry);
            if (!pos) return null;
            return (
              <div
                key={entry.id}
                className={`timeline-block ${colorFor(entry.title)}`}
                style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
                title={`${entry.title} · ${formatMinutes(entry.durationMin)}`}
              >
                {pos.height >= MIN_HEIGHT_FOR_LABEL ? `${entry.title} ${formatMinutes(entry.durationMin)}` : null}
              </div>
            );
          })}
        </div>
      </div>
      {!entries.length && <div className="empty">오늘 기록이 없습니다.</div>}
    </>
  );
}
