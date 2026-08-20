import type { IncomingMessage, ServerResponse } from "node:http";

/** Shapes of the extra fields Vercel's Node runtime injects at request time. */
export interface ApiRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}
