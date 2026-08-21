import { fetchFinance, type CardLoanItem } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { monthParam } from "../../utils/date";
import { EmbedStats } from "./shared/EmbedStats";

function won(n: number): string {
  return `₩${Math.round(n).toLocaleString()}`;
}

function formatMD(iso: string | null): string {
  const m = iso ? /^\d{4}-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${m[1]}.${m[2]}` : "";
}

function cardLoanCaption(items: CardLoanItem[]) {
  if (!items.length) return "—";
  return (
    <>
      {items.map((item, i) => (
        <span key={`${item.name}-${item.date}`}>
          {item.name} {formatMD(item.date)} {won(item.amount)}
          {i < items.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function FinanceWidget() {
  const month = monthParam();
  const { data, error } = useApiData((opts) => fetchFinance(month, opts), [month]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  return (
    <EmbedStats
      stats={[
        {
          key: "expense",
          label: "Expense",
          value: won(data.expenseTotal),
          caption: (
            <>
              고정 {won(data.fixedTotal)}
              <br />
              변동 {won(data.variableTotal)}
            </>
          ),
        },
        {
          key: "income",
          label: "Income",
          value: won(data.incomeTotal),
          caption: data.incomeCategories.join(" · ") || "—",
        },
        {
          key: "budget",
          label: "Budget left",
          value: data.budgetLeft != null ? won(data.budgetLeft) : "—",
          caption: data.budgetTotal != null ? `예산 ${won(data.budgetTotal)}` : "예산 없음",
        },
        {
          key: "cardloan",
          label: "Card / Loan",
          value: won(data.cardLoan.total),
          caption: cardLoanCaption(data.cardLoan.items),
        },
      ]}
    />
  );
}
