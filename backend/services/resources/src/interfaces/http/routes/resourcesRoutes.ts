import type { IncomingMessage, ServerResponse } from "node:http";

import type { ResourcesController } from "../controllers/ResourcesController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export async function handleResourcesRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: ResourcesController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const detailMatch = requestUrl.pathname.match(/^\/api\/v1\/resources\/([^/]+)$/);

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "resources",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/resources") {
    await controller.list(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/resources") {
    await controller.create(req, res);
    return true;
  }

  if (req.method === "GET" && detailMatch) {
    await controller.getById(req, res, detailMatch[1]);
    return true;
  }

  if (req.method === "PUT" && detailMatch) {
    await controller.update(req, res, detailMatch[1]);
    return true;
  }

  if (req.method === "DELETE" && detailMatch) {
    await controller.delete(req, res, detailMatch[1]);
    return true;
  }

  return false;
}
