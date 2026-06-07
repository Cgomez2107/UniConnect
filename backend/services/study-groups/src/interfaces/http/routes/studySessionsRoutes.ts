import type { IncomingMessage, ServerResponse } from "node:http";
import type { StudySessionsController } from "../controllers/StudySessionsController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": new TextEncoder().encode(body).byteLength.toString(),
  });
  res.end(body);
}

export async function handleStudySessionsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: StudySessionsController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");

  const seriesMatch = requestUrl.pathname.match(
    /^\/api\/v1\/study-groups\/([^/]+)\/sessions\/series$/,
  );
  const listMatch = requestUrl.pathname.match(
    /^\/api\/v1\/study-groups\/([^/]+)\/sessions$/,
  );
  const cancelMatch = requestUrl.pathname.match(
    /^\/api\/v1\/study-groups\/sessions\/([^/]+)$/,
  );
  const availabilityMatch = requestUrl.pathname.match(
    /^\/api\/v1\/study-groups\/sessions\/([^/]+)\/availability$/,
  );
  const attendeesMatch = requestUrl.pathname.match(
    /^\/api\/v1\/study-groups\/sessions\/([^/]+)\/attendees$/,
  );

  if (req.method === "POST" && seriesMatch) {
    await controller.handleCreateSeries(req, res, seriesMatch[1]);
    return true;
  }

  if (req.method === "GET" && listMatch) {
    await controller.handleListByGroup(req, res, listMatch[1]);
    return true;
  }

  if (req.method === "DELETE" && cancelMatch) {
    await controller.handleCancel(req, res, cancelMatch[1]);
    return true;
  }

  if (req.method === "PATCH" && availabilityMatch) {
    await controller.handleUpdateAvailability(req, res, availabilityMatch[1]);
    return true;
  }

  if (req.method === "GET" && attendeesMatch) {
    await controller.handleListAttendees(req, res, attendeesMatch[1]);
    return true;
  }

  return false;
}
