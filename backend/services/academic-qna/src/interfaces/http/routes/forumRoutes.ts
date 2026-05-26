import type { IncomingMessage, ServerResponse } from "node:http";
import type { ForumController } from "../controllers/ForumController.js";
import type { ZodSchema } from "zod";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  return raw;
}

async function validateBody<T extends ZodSchema>(
  req: IncomingMessage,
  res: ServerResponse,
  schema: T,
): Promise<boolean> {
  const raw = await readRawBody(req);
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    sendJson(res, 400, { error: "VALIDATION_ERROR", message: "JSON body inválido." });
    return false;
  }
  const result = (schema as ZodSchema).safeParse(parsed);
  if (!result.success) {
    sendJson(res, 400, {
      error: "VALIDATION_ERROR",
      message: "El cuerpo de la solicitud no cumple el contrato",
      details: {
        source: "body",
        fieldErrors: result.error.flatten().fieldErrors,
        formErrors: result.error.flatten().formErrors,
      },
    });
    return false;
  }
  (req as any).__validatedBody = result.data;
  return true;
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
    const { CreateQuestionRequestSchema } = await import("@uniconnect/shared-types/contracts/forum");
    const valid = await validateBody(req, res, CreateQuestionRequestSchema.shape.body);
    if (!valid) return true;
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
    const { CreateAnswerRequestSchema } = await import("@uniconnect/shared-types/contracts/forum");
    const valid = await validateBody(req, res, CreateAnswerRequestSchema.shape.body);
    if (!valid) return true;
    await controller.createAnswer(req, res, answersMatch[1]);
    return true;
  }

  if (req.method === "GET" && answersMatch) {
    await controller.listAnswers(req, res, answersMatch[1]);
    return true;
  }

  if (req.method === "POST" && solutionMatch) {
    const { MarkSolutionContract } = await import("@uniconnect/shared-types/contracts/forum");
    const valid = await validateBody(req, res, MarkSolutionContract.request.shape.body);
    if (!valid) return true;
    await controller.marcarComoSolucion(req, res, solutionMatch[1]);
    return true;
  }

  if (votesMatch) {
    const { CastVoteContract } = await import("@uniconnect/shared-types/contracts/forum");
    const valid = await validateBody(req, res, CastVoteContract.request.shape.body);
    if (!valid) return true;
    await controller.castVote(req, res);
    return true;
  }

  if (req.method === "PATCH" && pinMatch) {
    await controller.pinAnswer(req, res, pinMatch[1], pinMatch[2]);
    return true;
  }

  return false;
}
