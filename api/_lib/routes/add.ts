import type { ApiRequest, ApiResponse } from "../types.js";
import { createPage } from "../notion.js";
import { todayKST } from "../date.js";
import { sendError } from "../http.js";
import { DB } from "../db.js";

const TARGETS = ["task", "expense", "income", "life", "letter"] as const;
type Target = (typeof TARGETS)[number];

function titleProp(title: string) {
  return { Name: { title: [{ text: { content: title } }] } };
}

function addTask(title: string) {
  return createPage(DB.tasks, {
    ...titleProp(title),
    Status: { select: { name: "Inbox" } },
  });
}

function addFinance(title: string, type: "Expense" | "Income", amount: number) {
  return createPage(DB.finance, {
    ...titleProp(title),
    Type: { select: { name: type } },
    Date: { date: { start: todayKST() } },
    Amount: { number: type === "Expense" ? -Math.abs(amount) : Math.abs(amount) },
  });
}

function addLife(title: string) {
  return createPage(DB.life, {
    ...titleProp(title),
    Date: { date: { start: todayKST() } },
  });
}

function addLetter(title: string) {
  return createPage(DB.moneyLetter, {
    ...titleProp(title),
    Date: { date: { start: todayKST() } },
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as { to?: string; title?: string; amount?: number };
  const to = body.to as Target;
  const title = body.title?.trim();

  if (!TARGETS.includes(to)) {
    res.status(400).json({ error: "잘못된 요청입니다.", message: `to는 ${TARGETS.join("/")} 중 하나여야 합니다.` });
    return;
  }
  if (!title) {
    res.status(400).json({ error: "잘못된 요청입니다.", message: "제목을 입력하세요." });
    return;
  }

  try {
    if (to === "task") await addTask(title);
    else if (to === "expense") await addFinance(title, "Expense", body.amount ?? 0);
    else if (to === "income") await addFinance(title, "Income", body.amount ?? 0);
    else if (to === "life") await addLife(title);
    else await addLetter(title);

    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "add", to, title });
  }
}
