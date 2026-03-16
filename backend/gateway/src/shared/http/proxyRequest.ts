import type { IncomingMessage, ServerResponse } from "node:http";

import { sendJson } from "./sendJson.js";

/**
 * Proxies the incoming request to a downstream service preserving method,
 * headers and payload. It returns a normalized error payload on network faults.
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

  try {
    const downstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyParts.length > 0 ? bodyParts.join("") : undefined,
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
