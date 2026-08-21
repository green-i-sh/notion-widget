import { fetchFinanceMonth } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { monthParam } from "../../utils/date";
import { EmbedRows } from "./shared/EmbedRows";

function won(n: number): string {
  return `₩${Math.round(n).toLocaleString()}`;
}

export function FinanceMonthWidget() {
  const month = monthParam();
  const { data, error } = useApiData((opts) => fetchFinanceMonth(month, opts), [month]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  return (
    <>
      <div className="embed-stat-value">{won(data.expenseTotal)}</div>
      <EmbedRows
        rows={[
          { key: "fixed", label: "고정지출", value: won(data.fixedTotal) },
          { key: "variable", label: "변동지출", value: won(data.variableTotal) },
          { key: "budget", label: "남은 예산", value: data.budgetLeft != null ? won(data.budgetLeft) : "—" },
        ]}
      />
    </>
  );
}
