import type { IncomingMessage, ServerResponse } from "node:http";

import { sendJson } from "./sendJson.js";

/**
 * Reenvía la solicitud entrante al servicio downstream preservando método,
 * headers y cuerpo. Devuelve un payload de error normalizado ante fallos de red.
 *
 * Los métodos GET y HEAD no admiten cuerpo según la especificación HTTP.
 * Adjuntar `body` en esos casos provoca un error inmediato en Node.js fetch,
 * por lo que se omite explícitamente antes de despachar la solicitud downstream.
 */
export async function proxyRequest(
  req: IncomingMessage,
  res: ServerResponse,
  targetBaseUrl: string,
): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const targetUrl = new URL(requestUrl.pathname + requestUrl.search, targetBaseUrl);

  const bodyParts: string[] = [];
  const decoder = new TextDecoder();
  for await (const chunk of req) {
    if (chunk instanceof Uint8Array) {
      bodyParts.push(decoder.decode(chunk, { stream: true }));
      continue;
    }
    if (typeof chunk === "string") {
      bodyParts.push(chunk);
    }
  }
  bodyParts.push(decoder.decode());

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
      continue;
    }
    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  const method = req.method?.toUpperCase() ?? "GET";
  const isPayloadMethod = method !== "GET" && method !== "HEAD";
  const rawBody = bodyParts.join("");
  const body = isPayloadMethod && rawBody.length > 0 ? rawBody : undefined;

  try {
    const downstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseText = await downstreamResponse.text();
    const responseHeaders: Record<string, string> = {};
    downstreamResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    res.writeHead(downstreamResponse.status, responseHeaders);
    res.end(responseText);
  } catch (error) {
    sendJson(res, 502, {
      error: "Downstream service unavailable",
      details: error instanceof Error ? error.message : "Unknown proxy error",
    });
  }
}