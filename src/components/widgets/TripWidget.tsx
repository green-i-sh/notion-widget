import { fetchTrip } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";

const CATEGORY_COLOR: Record<string, string> = {
  숙소: "yellow",
  식비: "lav",
  교통: "green",
  카페: "purple",
};
const COLOR_CYCLE = ["lav", "purple", "green", "gray", "pink", "yellow"];

function colorFor(category: string, index: number): string {
  return CATEGORY_COLOR[category] ?? COLOR_CYCLE[index % COLOR_CYCLE.length];
}

function tripParam(): string | undefined {
  return new URLSearchParams(window.location.search).get("trip") ?? undefined;
}

function won(n: number): string {
  return `₩${Math.round(n).toLocaleString()}`;
}

function formatRange(start?: string | null, end?: string | null): string {
  if (!start) return "";
  const s = start.slice(2).replace(/-/g, ".");
  if (!end || end === start) return s;
  const e = end.slice(2).replace(/-/g, ".");
  return `${s} – ${e}`;
}

export function TripWidget() {
  const trip = tripParam();
  const { data, error } = useApiData((opts) => fetchTrip(trip, opts), [trip]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.found || !data.columns) return <div className="empty">해당 여행 기록이 없습니다.</div>;

  const maxAmount = Math.max(1, ...(data.expense?.categories.map((c) => c.amount) ?? [0]));

  return (
    <div className="trip-album">
      <div className={`trip-cover${data.cover ? " has-cover" : ""}`} style={data.cover ? { backgroundImage: `url(${data.cover})` } : undefined}>
        <div className="trip-cover-meta">
          <div className="trip-name">{data.name}</div>
          <div className="row" style={{ gap: 8 }}>
            {data.phase && <span className="embed-chip lav">{data.phase}</span>}
            <span className="trip-cover-sub">
              {formatRange(data.start, data.end)}
              {data.people ? ` · ${data.people}인` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="trip-cols">
        {data.columns.map((col) => (
          <div key={col.key} className="trip-col">
            <div className="widget-title">{col.label}</div>
            <div>{col.text || "—"}</div>
          </div>
        ))}
      </div>

      {data.expense && (
        <div className="trip-expense">
          <div className="row">
            <span className="widget-title">지출 합계</span>
            <span className="embed-row-value" style={{ marginLeft: "auto" }}>{won(data.expense.total)}</span>
          </div>
          <div className="trip-expense-bars">
            {data.expense.categories.map((c, i) => (
              <div key={c.category} className="trip-expense-row">
                <span className={`embed-chip ${colorFor(c.category, i)}`}>{c.category}</span>
                <div className="bar"><span style={{ width: `${(c.amount / maxAmount) * 100}%` }} /></div>
                <span className="muted">{won(c.amount)}</span>
              </div>
            ))}
            {!data.expense.categories.length && <div className="empty">지출 내역이 없습니다.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
