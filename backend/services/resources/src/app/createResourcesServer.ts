import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import type { ResourcesController } from "../interfaces/http/controllers/ResourcesController.js";
import { handleResourcesRoutes } from "../interfaces/http/routes/resourcesRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

export function createResourcesServer(controller: ResourcesController) {
  return createServer((req, res) => {
    const resp = res as ServerResponse & { setHeader(name: string, value: string): void };
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === "string" ? originHeader : "*";
    resp.setHeader("Access-Control-Allow-Origin", origin);
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id, ngrok-skip-browser-warning, bypass-tunnel-reminder");
    resp.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    void (async () => {
      const handled = await handleResourcesRoutes(req, res, controller);
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
