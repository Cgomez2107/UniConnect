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

  const method = req.method?.toUpperCase() ?? "GET";
  const isPayloadMethod = method !== "GET" && method !== "HEAD";
  const rawBody = bodyParts.join("");
  const body = isPayloadMethod && rawBody.length > 0 ? rawBody : undefined;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    // Evitar reenviar headers que causan conflictos en Fly.io internal networking o Node fetch
    const lowerKey = key.toLowerCase();
    if (["host", "connection", "content-length", "transfer-encoding", "content-encoding"].includes(lowerKey)) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
      continue;
    }
    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  try {
    const downstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const responseText = await downstreamResponse.text();
    const responseHeaders: Record<string, string> = {};
    downstreamResponse.headers.forEach((value, key) => {
      // Evitar propagar headers de hop-by-hop o compresión del downstream
      const lowerKey = key.toLowerCase();
      if (!["connection", "content-encoding", "transfer-encoding", "content-length"].includes(lowerKey)) {
        responseHeaders[key] = value;
      }
    });

    res.writeHead(downstreamResponse.status, responseHeaders);
    res.end(responseText);
  } catch (error) {
    console.error(`[Gateway Proxy Error] Method: ${method}, Target: ${targetUrl.href}, Error:`, error);
    sendJson(res, 502, {
      error: "Downstream service unavailable",
      details: error instanceof Error ? error.message : "Unknown proxy error",
    });
  }
}