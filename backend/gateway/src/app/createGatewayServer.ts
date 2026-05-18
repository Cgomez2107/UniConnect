import { createServer, type IncomingMessage, type ServerResponse as NodeServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WebSocketServer, WebSocket } from "ws";

import type { GatewayEnv } from "../shared/config/env.js";
import { proxyRequest, type ProxyResponse } from "../shared/http/proxyRequest.js";
import { sendJson } from "../shared/http/sendJson.js";
import { JWTMiddleware, type JWTPayload } from "../middleware/JWTMiddleware.js";

const conversationRooms = new Map<string, Set<WebSocket>>();
const studyGroupRooms = new Map<string, Set<WebSocket>>();

function getAppVersion(): string {
  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
    return manifest.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function isStudyGroupsRoute(pathname: string): boolean {
  return (
    pathname === "/api/v1/study-groups" ||
    pathname.startsWith("/api/v1/study-groups/") ||
    pathname === "/api/v1/notifications" ||
    pathname.startsWith("/api/v1/notifications/")
  );
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
    pathname.startsWith("/api/v1/catalog") ||
    pathname.startsWith("/perfil/") ||
    pathname === "/perfil" ||
    pathname.startsWith("/api/v1/perfil/") ||
    pathname === "/api/v1/perfil"
  );
}

function isEventsRoute(pathname: string): boolean {
  return (
    pathname === "/api/v1/events" ||
    pathname.startsWith("/api/v1/events/") ||
    pathname === "/api/v1/eventos/suscribir" ||
    pathname === "/api/v1/eventos/suscribir/" ||
    pathname === "/api/v1/eventos/suscripciones"
  );
}

function isForumRoute(pathname: string): boolean {
  return pathname === "/api/v1/forum" || pathname.startsWith("/api/v1/forum/");
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/api/v1/auth");
}

const setHeader = (res: NodeServerResponse, name: string, value: string) => {
  res.setHeader(name, value);
};

function extractConversationId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/v1\/conversations\/([^/]+)/);
  return match ? match[1] : null;
}

function extractConversationIdFromBody(body: string): string | null {
  try {
    const data = JSON.parse(body);
    if (data?.data?.conversation_id) return data.data.conversation_id;
    if (data?.conversation_id) return data.conversation_id;
    return null;
  } catch {
    return null;
  }
}

function broadcastToStudyGroup(groupId: string, event: string, payload: unknown): void {
  const room = studyGroupRooms.get(groupId);
  if (!room) {
    console.log(JSON.stringify({ service: "gateway", level: "warn", message: "broadcastToStudyGroup: no clients in room", groupId, event }));
    return;
  }
  const message = JSON.stringify({ event, payload });
  let sent = 0;
  for (const ws of room) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sent++;
    }
  }
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "broadcastToStudyGroup: sent", groupId, event, sent }));
}

function broadcastToConversation(conversationId: string, event: string, payload: unknown): void {
  const room = conversationRooms.get(conversationId);
  if (!room) return;
  const message = JSON.stringify({ event, payload });
  for (const ws of room) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

function handleWebSocketUpgrade(
  wss: WebSocketServer,
  jwtMiddleware: JWTMiddleware,
): void {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const token = requestUrl.searchParams.get("token");

    if (!token) {
      console.log(JSON.stringify({ service: "gateway", level: "warn", message: "WS connection rejected: missing token" }));
      ws.close(4001, "Missing authentication token");
      return;
    }

    const mockRes = {
      writeHead: () => mockRes,
      end: () => {},
      on: () => mockRes,
    } as unknown as NodeServerResponse;

    const payload = jwtMiddleware.authenticate(
      { ...req, headers: { ...req.headers, authorization: `Bearer ${token}` } } as IncomingMessage,
      mockRes,
    );

    if (!payload) {
      console.log(JSON.stringify({ service: "gateway", level: "warn", message: "WS connection rejected: invalid token" }));
      ws.close(4001, "Invalid or expired token");
      return;
    }

    console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS client connected", userId: payload.sub }));

    const subscribedConversations = new Set<string>();
    const subscribedGroups = new Set<string>();

    ws.on("message", (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === "subscribe" && msg.conversationId) {
          const convId = msg.conversationId;
          if (!conversationRooms.has(convId)) {
            conversationRooms.set(convId, new Set());
          }
          conversationRooms.get(convId)!.add(ws);
          subscribedConversations.add(convId);
          console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS subscribed to conversation", conversationId: convId }));
        }
        if (msg.type === "subscribe" && msg.groupId) {
          const groupId = msg.groupId;
          if (!studyGroupRooms.has(groupId)) {
            studyGroupRooms.set(groupId, new Set());
          }
          studyGroupRooms.get(groupId)!.add(ws);
          subscribedGroups.add(groupId);
          console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS subscribed to study group", groupId }));
        }
        if (msg.type === "unsubscribe" && msg.conversationId) {
          const room = conversationRooms.get(msg.conversationId);
          if (room) {
            room.delete(ws);
            if (room.size === 0) conversationRooms.delete(msg.conversationId);
          }
          subscribedConversations.delete(msg.conversationId);
        }
        if (msg.type === "unsubscribe" && msg.groupId) {
          const room = studyGroupRooms.get(msg.groupId);
          if (room) {
            room.delete(ws);
            if (room.size === 0) studyGroupRooms.delete(msg.groupId);
          }
          subscribedGroups.delete(msg.groupId);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      let unsubscribedGroups = 0, unsubscribedConversations = 0;
      for (const convId of subscribedConversations) {
        const room = conversationRooms.get(convId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) conversationRooms.delete(convId);
          unsubscribedConversations++;
        }
      }
      for (const groupId of subscribedGroups) {
        const room = studyGroupRooms.get(groupId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) studyGroupRooms.delete(groupId);
          unsubscribedGroups++;
        }
      }
      subscribedConversations.clear();
      subscribedGroups.clear();
      console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS client disconnected", userId: payload.sub, unsubscribedGroups, unsubscribedConversations }));
    });
  });
}

function onStudygroupsResponse(
  info: ProxyResponse,
  requestUrl: URL,
  _jwtPayload: JWTPayload,
): void {
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "onStudygroupsResponse called", method: info.method, pathname: info.pathname, status: info.status }));
  const groupIdMatch = info.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/messages$/);
  if (info.method === "POST" && groupIdMatch && info.status === 201) {
    const groupId = groupIdMatch[1];
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onStudygroupsResponse: broadcasting", groupId }));
    let messagePayload: unknown = info.body;
    try {
      const parsed = JSON.parse(info.body);
      messagePayload = parsed?.data || parsed;
    } catch {
      messagePayload = info.body;
    }
    broadcastToStudyGroup(groupId, "new_group_message", messagePayload);
  }
}

function onMessagingResponse(
  info: ProxyResponse,
  requestUrl: URL,
  jwtPayload: JWTPayload,
): void {
  if (info.method === "POST" && info.pathname === "/api/v1/messages" && info.status === 201) {
    const conversationId = extractConversationIdFromBody(info.body);
    if (conversationId) {
      let messagePayload: unknown = info.body;
      try {
        const parsed = JSON.parse(info.body);
        messagePayload = parsed?.data || parsed;
      } catch {
        messagePayload = info.body;
      }
      broadcastToConversation(conversationId, "new_message", messagePayload);
    }
    return;
  }

  if (info.method === "PATCH") {
    const conversationId = extractConversationId(info.pathname);
    if (conversationId && info.status === 200) {
      broadcastToConversation(conversationId, "message_read", {
        conversationId,
        userId: jwtPayload.sub,
      });
    }
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: NodeServerResponse,
  env: GatewayEnv,
  jwtMiddleware: JWTMiddleware,
): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const appVersion = getAppVersion();

  const allowedOrigins = [
    "http://localhost:8081",
    "http://localhost:8082",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://192.168.140.38:8081",
    "http://192.168.140.38:8082",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    setHeader(res, "Access-Control-Allow-Origin", origin);
    setHeader(res, "Access-Control-Allow-Credentials", "true");
    setHeader(res, "Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    setHeader(res, "Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    setHeader(
      res,
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, bypass-tunnel-reminder, ngrok-skip-browser-warning, x-api-version, X-API-Version",
    );
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.headers.authorization) {
    const token = jwtMiddleware.getToken(req);
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  }

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      version: appVersion,
    });
    return;
  }

  if (isAuthRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.authBaseUrl, "/api/v1/auth");
    return;
  }

  const payload = jwtMiddleware.authenticate(req, res);
  if (!payload) {
    return;
  }

  if (payload.sub) {
    req.headers["x-user-id"] = payload.sub;
  }

  if (isStudyGroupsRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.studyGroupsBaseUrl, undefined, (info) => {
      onStudygroupsResponse(info, requestUrl, payload);
    });
    return;
  }

  if (isResourcesRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.resourcesBaseUrl);
    return;
  }

  if (isMessagingRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.messagingBaseUrl, undefined, (info) => {
      onMessagingResponse(info, requestUrl, payload);
    });
    return;
  }

  if (isProfilesCatalogRoute(requestUrl.pathname)) {
    const stripPerfilPrefix = requestUrl.pathname.startsWith("/api/v1/perfil")
      ? "/api/v1"
      : undefined;
    await proxyRequest(req, res, env.profilesCatalogBaseUrl, stripPerfilPrefix);
    return;
  }

  if (isEventsRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.eventsBaseUrl);
    return;
  }

  if (isForumRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.forumBaseUrl);
    return;
  }

  sendJson(res, 404, {
    error: "Route not found",
    path: requestUrl.pathname,
  });
}

function validateGatewayEnv(): void {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const gatewayWarnings: string[] = [];

  if (!SUPABASE_URL?.trim()) {
    gatewayWarnings.push("SUPABASE_URL no está configurada — el gateway no podrá orquestar operaciones de almacenamiento");
  }
  if (!SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    gatewayWarnings.push("SUPABASE_SERVICE_ROLE_KEY no está configurada — el gateway no podrá orquestar operaciones que requieran service role");
  }

  if (SUPABASE_URL?.trim()) {
    try {
      const parsed = new URL(SUPABASE_URL.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      gatewayWarnings.push(`SUPABASE_URL no es una URL válida: "${SUPABASE_URL.trim()}"`);
    }
  }

  if (gatewayWarnings.length > 0) {
    for (const warning of gatewayWarnings) {
      console.warn(
        JSON.stringify({
          service: "gateway",
          level: "warn",
          message: warning,
        }),
      );
    }
  }
}

export function createGatewayServer(env: GatewayEnv) {
  validateGatewayEnv();
  const jwtMiddleware = new JWTMiddleware(env.jwtAccessSecret);

  const server = createServer((req, res) => {
    void handleRequest(req, res, env, jwtMiddleware).catch((error: unknown) => {
      sendJson(res, 500, {
        error: "Unexpected gateway failure",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    });
  });

  const wss = new WebSocketServer({ server: server as any, path: "/ws" });
  handleWebSocketUpgrade(wss, jwtMiddleware);

  return server;
}
