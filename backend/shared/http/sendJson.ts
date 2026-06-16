import type { ServerResponse } from "node:http";

export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
  errorCode?: string;
  name?: string;
  reason?: string;
  remainingMs?: number;
  details?: Record<string, unknown>;
}

export function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });

  res.end(body);
}

export function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string,
): void {
  sendJson(res, statusCode, { error: message });
}

export function sendData<T>(
  res: ServerResponse,
  statusCode: number,
  data: T,
  meta?: Record<string, unknown>,
): void {
  const payload = meta ? { data, meta } : { data };
  sendJson(res, statusCode, payload);
}

export function sendApiError(
  res: ServerResponse,
  statusCode: number,
  response: ApiErrorResponse,
): void {
  sendJson(res, statusCode, response);
}
