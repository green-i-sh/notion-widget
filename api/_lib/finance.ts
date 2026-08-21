import { queryDatabase, propNumber, propString } from "./notion.js";
import { DB } from "./db.js";

/** Category values that count as 고정지출 (WIDGET-SPEC.md §5). */
const FIXED_CATEGORIES = new Set(["주거", "통신", "보험", "구독"]);

export interface MonthFinance {
  month: string;
  expenseTotal: number;
  fixedTotal: number;
  variableTotal: number;
  incomeTotal: number;
  incomeCategories: string[];
  budgetTotal: number | null;
  budgetLeft: number | null;
}

/** Expense/income/fixed-variable split for one month, plus that month's budget row. Shared by ?w=finance and ?w=finance-month. */
export async function computeMonthFinance(month: string): Promise<MonthFinance> {
  const result = await queryDatabase(DB.finance, {
    filter: { property: "Month", formula: { string: { equals: month } } },
    page_size: 200,
  });

  let expenseTotal = 0;
  let fixedTotal = 0;
  let variableTotal = 0;
  let incomeTotal = 0;
  const incomeCategories = new Set<string>();

  for (const page of result.results) {
    const props = page.properties;
    const type = propString(props["Type"]);
    const amount = Math.abs(propNumber(props["Amount"]));
    const category = propString(props["Category"]);
    if (type === "Expense") {
      expenseTotal += amount;
      if (FIXED_CATEGORIES.has(category)) fixedTotal += amount;
      else variableTotal += amount;
    } else if (type === "Income") {
      incomeTotal += amount;
      if (category) incomeCategories.add(category);
    }
  }

  const budgetResult = await queryDatabase(DB.budget, {
    filter: { property: "Month", rich_text: { equals: month } },
    page_size: 1,
  });
  const budgetPage = budgetResult.results[0];
  const budgetTotal = budgetPage ? propNumber(budgetPage.properties["Budget"]) : null;
  const budgetLeft = budgetPage ? propNumber(budgetPage.properties["Left"]) : null;

  return {
    month,
    expenseTotal,
    fixedTotal,
    variableTotal,
    incomeTotal,
    incomeCategories: [...incomeCategories],
    budgetTotal,
    budgetLeft,
  };
}
