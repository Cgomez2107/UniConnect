import type { IncomingMessage, ServerResponse } from "node:http";
import type { EventsController } from "../controllers/EventsController.js";
import type { SubscriptionController } from "../controllers/SubscriptionController.js";
import type { ZodSchema } from "zod";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": new TextEncoder().encode(body).byteLength.toString(),
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

export async function handleEventsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  controller: EventsController,
  subscriptionController?: SubscriptionController,
): Promise<boolean> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const eventDetailMatch = requestUrl.pathname.match(/^\/api\/v1\/events\/([^/]+)$/);
  const eventActionMatch = requestUrl.pathname.match(
    /^\/api\/v1\/events\/([^/]+)\/(publish|cancel|finish)$/,
  );
  const eventRegisterMatch = requestUrl.pathname.match(
    /^\/api\/v1\/events\/([^/]+)\/register$/,
  );

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
    const { CreateEventRequestSchema } = await import("@uniconnect/shared-types/contracts/event");
    const valid = await validateBody(req, res, CreateEventRequestSchema.shape.body);
    if (!valid) return true;
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

  if (req.method === "PATCH" && eventDetailMatch) {
    await controller.update(req, res, eventDetailMatch[1]);
    return true;
  }

  if (req.method === "DELETE" && eventDetailMatch) {
    await controller.delete(req, res, eventDetailMatch[1]);
    return true;
  }

  if (req.method === "POST" && eventActionMatch) {
    const [, eventId, action] = eventActionMatch;
    switch (action) {
      case "publish":
        await controller.publish(req, res, eventId);
        return true;
      case "cancel":
        await controller.cancel(req, res, eventId);
        return true;
      case "finish":
        await controller.finish(req, res, eventId);
        return true;
    }
  }

  if (req.method === "POST" && eventRegisterMatch) {
    await controller.register(req, res, eventRegisterMatch[1]);
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/v1/eventos/suscribir") {
    if (!subscriptionController) { sendJson(res, 500, { error: "Subscription not available" }); return true; }
    await subscriptionController.subscribe(req, res);
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/v1/eventos/suscripciones") {
    if (!subscriptionController) { sendJson(res, 500, { error: "Subscription not available" }); return true; }
    await subscriptionController.getSubscriptions(req, res);
    return true;
  }

  if (req.method === "DELETE" && requestUrl.pathname === "/api/v1/eventos/suscribir") {
    if (!subscriptionController) { sendJson(res, 500, { error: "Subscription not available" }); return true; }
    await subscriptionController.unsubscribe(req, res);
    return true;
  }

  return false;
}
