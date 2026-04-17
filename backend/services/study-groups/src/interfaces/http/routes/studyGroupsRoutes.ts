import type { IncomingMessage, ServerResponse } from "node:http";

import type { StudyGroupsController } from "../controllers/StudyGroupsController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export async function handleStudyGroupsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: StudyGroupsController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const detailMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)$/);
  const applicationsMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/applications$/);
  const applyMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/apply$/);
  const reviewMatch = requestUrl.pathname.match(/^\/api\/v1\/study-groups\/applications\/([^/]+)\/review$/);

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "study-groups",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/study-groups") {
    await controller.list(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/study-groups") {
    await controller.create(req, res);
    return true;
  }

  if (req.method === "GET" && detailMatch) {
    await controller.getById(req, res, detailMatch[1]);
    return true;
  }

  if (req.method === "GET" && applicationsMatch) {
    await controller.listApplications(req, res, applicationsMatch[1]);
    return true;
  }

  if (req.method === "POST" && applyMatch) {
    await controller.apply(req, res, applyMatch[1]);
    return true;
  }

  if (req.method === "PUT" && reviewMatch) {
    await controller.review(req, res, reviewMatch[1]);
    return true;
  }

  return false;
}
