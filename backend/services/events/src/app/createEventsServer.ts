import { createServer } from "node:http";
import type { ServerResponse, IncomingMessage } from "node:http";
import type { EventsController } from "../interfaces/http/controllers/EventsController.js";
import type { SubscriptionController } from "../interfaces/http/controllers/SubscriptionController.js";
import { handleEventsRoutes } from "../interfaces/http/routes/eventsRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function stubAuthForTest(req: IncomingMessage, res: ServerResponse): boolean {
  if (process.env.NODE_ENV !== "test") return false;
  const userId = req.headers["x-user-id"];
  if (typeof userId !== "string" || !userId.trim()) return false;

  const fakePayload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  (req.headers as Record<string, string>)["authorization"] = `Bearer x.${fakePayload}.sig`;

  const userRole = req.headers["x-user-role"];
  if (typeof userRole === "string" && userRole.trim()) {
    const enrichedPayload = Buffer.from(
      JSON.stringify({ sub: userId, role: userRole }),
    ).toString("base64url");
    (req.headers as Record<string, string>)["authorization"] = `Bearer x.${enrichedPayload}.sig`;
  }

  return true;
}

export function createEventsServer(
  controller: EventsController,
  subscriptionController?: SubscriptionController,
) {
  return createServer((req, res) => {
    const resp = res as ServerResponse & { setHeader(name: string, value: string): void };
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === "string" ? originHeader : "*";
    resp.setHeader("Access-Control-Allow-Origin", origin);
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id, x-user-role, ngrok-skip-browser-warning, bypass-tunnel-reminder");
    resp.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    stubAuthForTest(req, res);

    void (async () => {
      const handled = await handleEventsRoutes(req, res, controller, subscriptionController);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"));
    });
  });
}
