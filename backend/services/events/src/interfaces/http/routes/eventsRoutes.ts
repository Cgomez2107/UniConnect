import type { IncomingMessage, ServerResponse } from "node:http";
import type { EventsController } from "../controllers/EventsController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": new TextEncoder().encode(body).byteLength.toString(),
  });
  res.end(body);
}

export async function handleEventsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: EventsController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const eventDetailMatch = requestUrl.pathname.match(/^\/api\/v1\/events\/([^/]+)$/);

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "events",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/events") {
    await controller.list(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/events") {
    await controller.create(req, res);
    return true;
  }

  if (req.method === "GET" && eventDetailMatch) {
    await controller.getById(req, res, eventDetailMatch[1]);
    return true;
  }

  if (req.method === "PUT" && eventDetailMatch) {
    await controller.update(req, res, eventDetailMatch[1]);
    return true;
  }

  if (req.method === "DELETE" && eventDetailMatch) {
    await controller.delete(req, res, eventDetailMatch[1]);
    return true;
  }

  return false;
}
