import type { ServerResponse } from "node:http";

/**
 * Serializa y envía una respuesta JSON con headers correctos.
 *
 * Garantiza:
 * - Content-Type correcto
 * - Content-Length preciso
 * - Charset UTF-8
 *
 * @param res - ServerResponse
 * @param statusCode - HTTP status code (200, 400, 401, etc.)
 * @param payload - Objeto a serializar como JSON
 */
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

/**
 * Envía error JSON estándar
 * @param res - ServerResponse
 * @param statusCode - HTTP status code
 * @param message - Mensaje de error
 */
export function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string,
): void {
  sendJson(res, statusCode, { error: message });
}

/**
 * Envía datos JSON estándar
 * @param res - ServerResponse
 * @param statusCode - HTTP status code
 * @param data - Datos a enviar
 * @param meta - Metadatos opcionales (total, page, etc.)
 */
export function sendData<T>(
  res: ServerResponse,
  statusCode: number,
  data: T,
  meta?: Record<string, unknown>,
): void {
  const payload = meta ? { data, meta } : { data };
  sendJson(res, statusCode, payload);
}
