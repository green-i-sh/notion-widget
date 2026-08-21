import { fetchCategory } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { monthParam } from "../../utils/date";
import { EmbedRows, type EmbedRowItem } from "./shared/EmbedRows";

const CATEGORY_COLOR: Record<string, string> = {
  식비: "lav",
  카페: "purple",
  교통: "green",
  책: "gray",
  생활: "pink",
  숙소: "yellow",
};
const COLOR_CYCLE = ["lav", "purple", "green", "gray", "pink", "yellow"];

function colorFor(category: string, index: number): string {
  return CATEGORY_COLOR[category] ?? COLOR_CYCLE[index % COLOR_CYCLE.length];
}

function won(n: number): string {
  return `₩${Math.round(Math.abs(n)).toLocaleString()}`;
}

function deltaText(delta: number | null): string {
  if (delta === null) return "—";
  if (delta === 0) return "±0";
  return `${delta > 0 ? "+" : "-"}${Math.round(Math.abs(delta)).toLocaleString()}`;
}

export function CategoryWidget() {
  const month = monthParam();
  const { data, error } = useApiData((opts) => fetchCategory(month, opts), [month]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!data.rows.length) return <div className="empty">이번 달 변동지출 내역이 없습니다.</div>;

  const rows: EmbedRowItem[] = data.rows.map((r, i) => ({
    key: r.category,
    label: <span className={`embed-chip ${colorFor(r.category, i)}`}>{r.category}</span>,
    value: (
      <span className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <span>−{won(r.amount)}</span>
        <span className="muted" style={r.delta !== null && r.delta > 0 ? { color: "var(--pink-ink)" } : undefined}>
          {deltaText(r.delta)}
        </span>
      </span>
    ),
  }));
  rows.push({ key: "total", label: "합계", value: `−${won(data.total)}` });

  return <EmbedRows rows={rows} />;
}
