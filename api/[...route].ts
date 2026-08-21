import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import health from "./_lib/routes/health.js";
import today from "./_lib/routes/today.js";
import routine from "./_lib/routes/routine.js";
import timeline from "./_lib/routes/timeline.js";
import bingo from "./_lib/routes/bingo.js";
import finance from "./_lib/routes/finance.js";
import financeMonth from "./_lib/routes/finance-month.js";
import life from "./_lib/routes/life.js";
import review from "./_lib/routes/review.js";
import shelf from "./_lib/routes/shelf.js";
import category from "./_lib/routes/category.js";
import trip from "./_lib/routes/trip.js";
import streak from "./_lib/routes/streak.js";

/**
 * Single catch-all function for every /api/* route. Vercel's Hobby plan caps
 * a deployment at 12 serverless functions — one file per endpoint blew past
 * that once WIDGET-SPEC.md's widgets added up. Routing in-process here means
 * the function count stays at 1 no matter how many endpoints get added.
 */
const ROUTES: Record<string, (req: ApiRequest, res: ApiResponse) => Promise<void>> = {
  health,
  today,
  routine,
  timeline,
  bingo,
  finance,
  "finance-month": financeMonth,
  life,
  review,
  shelf,
  category,
  trip,
  streak,
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const segments = req.query.route;
  const name = Array.isArray(segments) ? segments[0] : segments;
  const route = name ? ROUTES[name] : undefined;

  if (!route) {
    res.status(404).json({ error: "존재하지 않는 API입니다.", path: name ?? null });
    return;
  }
  await route(req, res);
}
