import type { IncomingMessage, ServerResponse } from "node:http";
import type { ForumController } from "../controllers/ForumController.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export async function handleForumRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: ForumController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const questionsListMatch = req.method === "GET" && requestUrl.pathname === "/api/v1/forum/questions";
  const questionsDetailMatch = requestUrl.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)$/);
  const answersMatch = requestUrl.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)\/answers$/);
  const pinMatch = requestUrl.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)\/answers\/([^/]+)\/pin$/);
  const solutionMatch = requestUrl.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)\/solution$/);
  const votesMatch = req.method === "POST" && requestUrl.pathname === "/api/v1/forum/votes";

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "academic-qna",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/forum/questions") {
    await controller.createQuestion(req, res);
    return true;
  }

  if (questionsListMatch) {
    await controller.listQuestions(req, res);
    return true;
  }

  if (req.method === "GET" && questionsDetailMatch) {
    await controller.getQuestionDetail(req, res, questionsDetailMatch[1]);
    return true;
  }

  if (req.method === "POST" && answersMatch) {
    await controller.createAnswer(req, res, answersMatch[1]);
    return true;
  }

  if (req.method === "GET" && answersMatch) {
    await controller.listAnswers(req, res, answersMatch[1]);
    return true;
  }

  if (req.method === "POST" && solutionMatch) {
    await controller.marcarComoSolucion(req, res, solutionMatch[1]);
    return true;
  }

  if (votesMatch) {
    await controller.castVote(req, res);
    return true;
  }

  if (req.method === "PATCH" && pinMatch) {
    await controller.pinAnswer(req, res, pinMatch[1], pinMatch[2]);
    return true;
  }

  return false;
}
