/**
 * Runtime check for api/[...route].ts's routing. Not a framework test —
 * run directly with node after compiling (see package.json "test:routes").
 * Guards against the bug where the Vite Vercel preset leaves req.query.route
 * empty and every request 404s even though the function itself runs fine.
 */
import assert from "node:assert/strict";
import type { ApiRequest, ApiResponse } from "./types.js";
import handler, { ROUTES } from "../[...route].js";

function mockReq(url: string, query: Record<string, string | string[] | undefined> = {}): ApiRequest {
  return { url, method: "GET", query } as unknown as ApiRequest;
}

function mockRes(): { res: ApiResponse; result: () => { status: number; body: unknown } } {
  let status = 200;
  let body: unknown;
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
    },
  } as unknown as ApiResponse;
  return { res, result: () => ({ status, body }) };
}

async function main() {
  // No NOTION_TOKEN locally, so a correctly-routed handler fails inside its
  // own try/catch with sendError(..., { endpoint: "<name>" }) — that endpoint
  // field is proof the request reached the right handler, not a routing 404.

  {
    const { res, result } = mockRes();
    await handler(mockReq("/api/today?date=2026-08-19"), res);
    const { body } = result();
    const b = body as { endpoint?: string; error?: string };
    assert.notEqual(b.error, "존재하지 않는 API입니다.", `should not 404: ${JSON.stringify(body)}`);
    assert.equal(b.endpoint, "today", `expected endpoint "today", got: ${JSON.stringify(body)}`);
    console.log("PASS  req.query.route empty, /api/today?date=... still routes via req.url ->", b.endpoint);
  }

  {
    const { res, result } = mockRes();
    await handler(mockReq("/api/whatever-vercel-actually-sends", { route: ["routine"] }), res);
    const { body } = result();
    const b = body as { endpoint?: string };
    assert.equal(b.endpoint, "routine", `expected endpoint "routine", got: ${JSON.stringify(body)}`);
    console.log("PASS  req.query.route, when present, is honored ->", b.endpoint);
  }

  {
    const { res, result } = mockRes();
    await handler(mockReq("/api/streak/?x=1"), res);
    const { body } = result();
    const b = body as { endpoint?: string };
    assert.equal(b.endpoint, "streak", `expected endpoint "streak", got: ${JSON.stringify(body)}`);
    console.log("PASS  trailing slash + querystring parsed correctly ->", b.endpoint);
  }

  {
    const { res, result } = mockRes();
    await handler(mockReq("/api/nope"), res);
    const { status, body } = result();
    const b = body as { error: string; path: string; url: string; availableRoutes: string[] };
    assert.equal(status, 404);
    assert.equal(b.path, "nope");
    assert.equal(b.url, "/api/nope");
    assert.equal(b.availableRoutes.length, Object.keys(ROUTES).length);
    assert.equal(b.availableRoutes.length, 15, `expected 15 routes, got ${b.availableRoutes.length}: ${b.availableRoutes}`);
    console.log("PASS  /api/nope -> 404 with availableRoutes:", b.availableRoutes);
  }

  console.log("\nALL PASS");
}

main().catch((err) => {
  console.error("FAIL", err);
  process.exitCode = 1;
});
