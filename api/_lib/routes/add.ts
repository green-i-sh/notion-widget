import type { ApiRequest, ApiResponse } from "../types.js";
import { createPage } from "../notion.js";
import { todayKST } from "../date.js";
import { sendError } from "../http.js";
import { requireKey } from "../auth.js";
import { DB } from "../db.js";

const TARGETS = ["task", "expense", "income", "life", "letter"] as const;
type Target = (typeof TARGETS)[number];

function titleProp(title: string) {
  return { Name: { title: [{ text: { content: title } }] } };
}

/** A non-finite/non-number amount (e.g. a stray string from a malformed
 *  request) must never reach Notion as NaN — fall back to 0 instead. */
function safeAmount(amount: unknown): number {
  return typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
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
  if (!requireKey(req, res)) return;

  const body = (req.body ?? {}) as { to?: string; title?: string; amount?: unknown };
  const to = body.to as Target;
  const title = body.title?.trim();
  const amount = safeAmount(body.amount);

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
    else if (to === "expense") await addFinance(title, "Expense", amount);
    else if (to === "income") await addFinance(title, "Income", amount);
    else if (to === "life") await addLife(title);
    else await addLetter(title);

    res.status(200).json({ ok: true });
  } catch (err) {
    sendError(res, err, { endpoint: "add", to, title });
  }
}
