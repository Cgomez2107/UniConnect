import type { IncomingMessage, ServerResponse } from "node:http";

import type { MessagingController } from "../controllers/MessagingController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });

  res.end(body);
}

export async function handleMessagingRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: MessagingController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const conversationDetailMatch = requestUrl.pathname.match(/^\/api\/v1\/conversations\/([^/]+)$/);
  const conversationTouchMatch = requestUrl.pathname.match(/^\/api\/v1\/conversations\/([^/]+)\/touch$/);
  const messageDetailMatch = requestUrl.pathname.match(/^\/api\/v1\/messages\/([^/]+)$/);
  const messageReadMatch = requestUrl.pathname.match(/^\/api\/v1\/messages\/([^/]+)\/read$/);

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "messaging",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/conversations") {
    await controller.listConversations(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/conversations") {
    await controller.getOrCreateConversation(req, res);
    return true;
  }

  if (req.method === "GET" && conversationDetailMatch) {
    await controller.getConversationById(req, res, conversationDetailMatch[1]);
    return true;
  }

  if (req.method === "PATCH" && conversationTouchMatch) {
    await controller.touchConversation(req, res, conversationTouchMatch[1]);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/messages") {
    await controller.listMessages(req, res);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/messages") {
    await controller.createMessage(req, res);
    return true;
  }

  if (req.method === "GET" && messageDetailMatch) {
    await controller.getMessageById(req, res, messageDetailMatch[1]);
    return true;
  }

  if (req.method === "PATCH" && messageReadMatch) {
    await controller.markMessageAsRead(req, res, messageReadMatch[1]);
    return true;
  }

  return false;
}
