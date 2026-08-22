import type { ApiRequest, ApiResponse } from "./_lib/types.js";
import health from "./_lib/routes/health.js";
import today from "./_lib/routes/today.js";
import routine from "./_lib/routes/routine.js";
import timeline from "./_lib/routes/timeline.js";
import calendar from "./_lib/routes/calendar.js";
import bingo from "./_lib/routes/bingo.js";
import finance from "./_lib/routes/finance.js";
import financeMonth from "./_lib/routes/finance-month.js";
import life from "./_lib/routes/life.js";
import review from "./_lib/routes/review.js";
import shelf from "./_lib/routes/shelf.js";
import category from "./_lib/routes/category.js";
import trip from "./_lib/routes/trip.js";
import streak from "./_lib/routes/streak.js";
import morning from "./_lib/routes/morning.js";
import meta from "./_lib/routes/meta.js";
import bookSearch from "./_lib/routes/book-search.js";
import bookAdd from "./_lib/routes/book-add.js";

/**
 * Single catch-all function for every /api/* route. Vercel's Hobby plan caps
 * a deployment at 12 serverless functions — one file per endpoint blew past
 * that once WIDGET-SPEC.md's widgets added up. Routing in-process here means
 * the function count stays at 1 no matter how many endpoints get added.
 */
export const ROUTES: Record<string, (req: ApiRequest, res: ApiResponse) => Promise<void>> = {
  health,
  today,
  routine,
  timeline,
  calendar,
  bingo,
  finance,
  "finance-month": financeMonth,
  life,
  review,
  shelf,
  category,
  trip,
  streak,
  morning,
  meta,
  "book-search": bookSearch,
  "book-add": bookAdd,
};

/**
 * Vite's Vercel preset doesn't always populate req.query.route for the
 * [...route] catch-all the way Next.js does, so req.url is the only thing
 * we can trust — parse the first path segment after /api/ ourselves.
 * Strips the querystring/hash and any trailing slash first.
 */
export function routeNameFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const pathname = url.split("?")[0].split("#")[0].replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);
  const apiIndex = segments.lastIndexOf("api");
  const rest = apiIndex >= 0 ? segments.slice(apiIndex + 1) : segments;
  return rest[0];
}

function routeName(req: ApiRequest): string | undefined {
  const fromQuery = req.query.route;
  const queryName = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery;
  return queryName || routeNameFromUrl(req.url);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const name = routeName(req);
  const route = name ? ROUTES[name] : undefined;

  if (!route) {
    res.status(404).json({
      error: "존재하지 않는 API입니다.",
      path: name ?? null,
      url: req.url ?? null,
      availableRoutes: Object.keys(ROUTES),
    });
    return;
  }
  await route(req, res);
}
