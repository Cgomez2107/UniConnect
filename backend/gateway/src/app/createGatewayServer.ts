import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import type { GatewayEnv } from "../shared/config/env.js";
import { proxyRequest } from "../shared/http/proxyRequest.js";
import { sendJson } from "../shared/http/sendJson.js";

function isStudyGroupsRoute(pathname: string): boolean {
  return pathname === "/api/v1/study-groups" || pathname.startsWith("/api/v1/study-groups/");
}

function isResourcesRoute(pathname: string): boolean {
  return pathname === "/api/v1/resources" || pathname.startsWith("/api/v1/resources/");
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, env: GatewayEnv): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "gateway",
      status: "ok",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (isStudyGroupsRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.studyGroupsBaseUrl);
    return;
  }

  if (isResourcesRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.resourcesBaseUrl);
    return;
  }

  sendJson(res, 404, {
    error: "Route not found",
    path: requestUrl.pathname,
  });
}

/**
 * Builds the gateway HTTP server with explicit dependency injection via env.
 */
export function createGatewayServer(env: GatewayEnv) {
  return createServer((req, res) => {
    void handleRequest(req, res, env).catch((error: unknown) => {
      sendJson(res, 500, {
        error: "Unexpected gateway failure",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    });
  });
}
