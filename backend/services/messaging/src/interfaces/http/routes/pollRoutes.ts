import type { IncomingMessage, ServerResponse } from "node:http";

import type { PollController } from "../controllers/PollController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });

  res.end(body);
}

export async function handlePollRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: PollController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/polls") {
    await controller.createPollMessage(req, res);
    return true;
  }

  const votesMatch = requestUrl.pathname.match(/^\/api\/v1\/polls\/([^/]+)\/votes$/);
  const resultsMatch = requestUrl.pathname.match(/^\/api\/v1\/polls\/([^/]+)\/results$/);

  if (req.method === "POST" && votesMatch) {
    await controller.castVote(req, res, votesMatch[1]);
    return true;
  }

  if (req.method === "GET" && resultsMatch) {
    await controller.getPollResults(req, res, resultsMatch[1]);
    return true;
  }

  return false;
}
