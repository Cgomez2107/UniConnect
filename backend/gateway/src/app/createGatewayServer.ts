import { createServer, type IncomingMessage, type ServerResponse as NodeServerResponse } from "node:http";

import type { GatewayEnv } from "../shared/config/env.js";
import { proxyRequest } from "../shared/http/proxyRequest.js";
import { sendJson } from "../shared/http/sendJson.js";
import { JWTMiddleware } from "../middleware/JWTMiddleware.js";

function isStudyGroupsRoute(pathname: string): boolean {
  return pathname === "/api/v1/study-groups" || pathname.startsWith("/api/v1/study-groups/");
}

function isResourcesRoute(pathname: string): boolean {
  return pathname === "/api/v1/resources" || pathname.startsWith("/api/v1/resources/");
}

function isMessagingRoute(pathname: string): boolean {
  return (
    pathname === "/api/v1/conversations" ||
    pathname.startsWith("/api/v1/conversations/") ||
    pathname === "/api/v1/messages" ||
    pathname.startsWith("/api/v1/messages/")
  );
}

function isProfilesCatalogRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/v1/students") ||
    pathname.startsWith("/api/v1/catalog")
  );
}

function isEventsRoute(pathname: string): boolean {
  return pathname === "/api/v1/events" || pathname.startsWith("/api/v1/events/");
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/api/v1/auth");
}

const setHeader = (res: NodeServerResponse, name: string, value: string) => {
  res.setHeader(name, value);
};

async function handleRequest(req: IncomingMessage, res: NodeServerResponse, env: GatewayEnv): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const jwtMiddleware = new JWTMiddleware(env.jwtAccessSecret);
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";

  if (origin) {
    setHeader(res, "Access-Control-Allow-Origin", origin);
    setHeader(res, "Access-Control-Allow-Credentials", "true");
    setHeader(res, "Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    setHeader(res, "Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    setHeader(
      res,
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, bypass-tunnel-reminder, ngrok-skip-browser-warning",
    );
    res.writeHead(204);
    res.end();
    return;
  }

  // Inyectar token desde cookies si no viene en el header (Criterio 2)
  if (!req.headers.authorization) {
    const token = jwtMiddleware.getToken(req);
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  }

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      service: "gateway",
      status: "ok",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Rutas de autenticación (sin protección de JWT)
  if (isAuthRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.authBaseUrl);
    return;
  }

  // Rutas protegidas (requieren JWT válido)
  const payload = jwtMiddleware.authenticate(req, res);
  if (!payload) {
    // El middleware ya envió la respuesta de error
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

  if (isMessagingRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.messagingBaseUrl);
    return;
  }
  if (isProfilesCatalogRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.profilesCatalogBaseUrl);
    return;
  }

  if (isEventsRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.eventsBaseUrl);
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
