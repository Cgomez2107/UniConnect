import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChatbotController } from "../controllers/ChatbotController.js";
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

export async function handleChatbotRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: ChatbotController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "chatbot",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/chatbot/message") {
    const { SendChatbotMessageRequestSchema } = await import("@uniconnect/shared-types");
    const valid = await validateBody(req, res, SendChatbotMessageRequestSchema.shape.body);
    if (!valid) return true;
    await controller.sendMessage(req, res);
    return true;
  }

  return false;
}
