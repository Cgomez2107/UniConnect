import type { IncomingMessage, ServerResponse } from "node:http";
import type { ResourcesController } from "../controllers/ResourcesController.js";
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
  return Buffer.concat(chunks).toString("utf-8").trim();
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
    const { CreateResourceRequestSchema } = await import("@uniconnect/shared-types/contracts/resource");
    const valid = await validateBody(req, res, CreateResourceRequestSchema.shape.body);
    if (!valid) return true;
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
