import { fetchTrip } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";

function tripParam(): string | undefined {
  return new URLSearchParams(window.location.search).get("trip") ?? undefined;
}

export function TripWidget() {
  const trip = tripParam();
  const { data, error } = useApiData((opts) => fetchTrip(trip, opts), [trip]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.found || !data.columns) return <div className="empty">해당 여행 기록이 없습니다.</div>;

  return (
    <div className="trip-cols">
      {data.columns.map((col) => (
        <div key={col.key} className="trip-col">
          <div className="widget-title">{col.label}</div>
          <div>{col.text || "—"}</div>
          {col.tag && <span className="muted">{col.tag}</span>}
        </div>
      ))}
    </div>
  );
}
