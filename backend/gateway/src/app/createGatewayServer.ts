import { createServer, type IncomingMessage, type ServerResponse as NodeServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";

import type { GatewayEnv } from "../shared/config/env.js";
import { proxyRequest, type ProxyResponse } from "../shared/http/proxyRequest.js";
import { sendJson } from "../shared/http/sendJson.js";
import { JWTMiddleware, type JWTPayload } from "../middleware/JWTMiddleware.js";

const PUBLIC_PATHS = new Set([
  "/docs",
  "/docs/",
  "/api/v1/openapi.json",
]);

const conversationRooms = new Map<string, Set<WebSocket>>();
const studyGroupRooms = new Map<string, Set<WebSocket>>();
const forumSubjectRooms = new Map<string, Set<WebSocket>>();
const forumQuestionRooms = new Map<string, Set<WebSocket>>();
const eventsRoom = new Set<WebSocket>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEPLOYED_AT = new Date().toISOString();

function getAppVersion(): string {
  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
    return manifest.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function getHealthPayload(version: string) {
  return {
    status: "ok",
    version,
    commit: process.env.COMMIT_SHA ?? "unknown",
    deployedAt: DEPLOYED_AT,
  };
}

const OPENAPI_SPEC_PATH = resolve(
  import.meta.dirname ?? __dirname,
  "../public/openapi.json",
);

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>UniConnect API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -webkit-scrollbar; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/v1/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

function handleDocsRequest(
  requestUrl: URL,
  res: NodeServerResponse,
): void {
  const pathname = requestUrl.pathname;

  if (pathname === "/api/v1/openapi.json") {
    try {
      if (!existsSync(OPENAPI_SPEC_PATH)) {
        sendJson(res, 404, { error: "OpenAPI spec not found. Run 'pnpm merge:openapi' first." });
        return;
      }
      const spec = readFileSync(OPENAPI_SPEC_PATH, { encoding: "utf-8" }) as string;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(spec);
      return;
    } catch (err) {
      sendJson(res, 500, { error: "Failed to read OpenAPI spec", details: err instanceof Error ? err.message : "Unknown error" });
      return;
    }
  }

  if (pathname.startsWith("/docs")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(SWAGGER_HTML);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
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

function isPollRoute(pathname: string): boolean {
  return pathname === "/api/v1/polls" || pathname.startsWith("/api/v1/polls/");
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
  if (!room) {
    console.log(JSON.stringify({ service: "gateway", level: "warn", message: "broadcastToConversation: ROOM EMPTY", conversationId, event }));
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
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "broadcastToConversation: sent", conversationId, event, sent, roomSize: room.size }));
}

function broadcastToForumSubject(subjectId: string, event: string, payload: unknown): void {
  const room = forumSubjectRooms.get(subjectId);
  if (!room) {
    console.log(JSON.stringify({ service: "gateway", level: "warn", message: "broadcastToForumSubject: ROOM EMPTY", subjectId, event }));
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
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "broadcastToForumSubject: sent", subjectId, event, sent, roomSize: room.size }));
}

function broadcastToForumQuestion(questionId: string, event: string, payload: unknown): void {
  const room = forumQuestionRooms.get(questionId);
  if (!room) {
    console.log(JSON.stringify({ service: "gateway", level: "warn", message: "broadcastToForumQuestion: ROOM EMPTY", questionId, event }));
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
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "broadcastToForumQuestion: sent", questionId, event, sent, roomSize: room.size }));
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
    const subscribedSubjects = new Set<string>();
    const subscribedQuestions = new Set<string>();
    let subscribedToEvents = false;

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
        if (msg.type === "subscribe" && msg.channel === "events") {
          eventsRoom.add(ws);
          subscribedToEvents = true;
          console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS subscribed to events channel" }));
        }
        if (msg.type === "unsubscribe" && msg.channel === "events") {
          eventsRoom.delete(ws);
          subscribedToEvents = false;
        }
        if (msg.type === "subscribe" && msg.subjectId) {
          const subId = msg.subjectId;
          if (!forumSubjectRooms.has(subId)) {
            forumSubjectRooms.set(subId, new Set());
          }
          forumSubjectRooms.get(subId)!.add(ws);
          subscribedSubjects.add(subId);
          console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS subscribed to forum subject", subjectId: subId }));
        }
        if (msg.type === "subscribe" && msg.questionId) {
          const qId = msg.questionId;
          if (!forumQuestionRooms.has(qId)) {
            forumQuestionRooms.set(qId, new Set());
          }
          forumQuestionRooms.get(qId)!.add(ws);
          subscribedQuestions.add(qId);
          console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS subscribed to forum question", questionId: qId }));
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
        if (msg.type === "unsubscribe" && msg.subjectId) {
          const room = forumSubjectRooms.get(msg.subjectId);
          if (room) {
            room.delete(ws);
            if (room.size === 0) forumSubjectRooms.delete(msg.subjectId);
          }
          subscribedSubjects.delete(msg.subjectId);
        }
        if (msg.type === "unsubscribe" && msg.questionId) {
          const room = forumQuestionRooms.get(msg.questionId);
          if (room) {
            room.delete(ws);
            if (room.size === 0) forumQuestionRooms.delete(msg.questionId);
          }
          subscribedQuestions.delete(msg.questionId);
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
      for (const subId of subscribedSubjects) {
        const room = forumSubjectRooms.get(subId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) forumSubjectRooms.delete(subId);
        }
      }
      for (const qId of subscribedQuestions) {
        const room = forumQuestionRooms.get(qId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) forumQuestionRooms.delete(qId);
        }
      }
      subscribedConversations.clear();
      subscribedGroups.clear();
      subscribedSubjects.clear();
      subscribedQuestions.clear();
      if (subscribedToEvents) {
        eventsRoom.delete(ws);
        subscribedToEvents = false;
      }
      console.log(JSON.stringify({ service: "gateway", level: "info", message: "WS client disconnected", userId: payload.sub, unsubscribedGroups, unsubscribedConversations }));
    });
  });
}

function onStudygroupsResponse(
  info: ProxyResponse,
  requestUrl: URL,
  jwtPayload: JWTPayload,
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

  const reactionMatch = info.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/messages\/([^/]+)\/reactions$/);
  if (info.method === "POST" && reactionMatch && info.status === 200) {
    const groupId = reactionMatch[1];
    const messageId = reactionMatch[2];
    const rawBody = (() => {
      try {
        const parsed = JSON.parse(info.body);
        return parsed?.data || parsed;
      } catch {
        return info.body;
      }
    })();
    const reactions = (rawBody as any)?.reactions ?? rawBody;
    broadcastToStudyGroup(groupId, "reaction_updated", {
      messageId,
      userId: jwtPayload.sub,
      reactions,
    });
  }

  const pollVoteMatch = info.pathname.match(/^\/api\/v1\/study-groups\/([^/]+)\/messages\/([^/]+)\/polls\/vote$/);
  if (info.method === "POST" && pollVoteMatch && info.status === 200) {
    const groupId = pollVoteMatch[1];
    const messageId = pollVoteMatch[2];
    const rawBody = (() => {
      try {
        const parsed = JSON.parse(info.body);
        return parsed?.data || parsed;
      } catch {
        return info.body;
      }
    })();
    const poll = (rawBody as any)?.poll ?? rawBody;
    broadcastToStudyGroup(groupId, "poll_updated", {
      messageId,
      userId: jwtPayload.sub,
      optionIndex: (rawBody as any)?.optionIndex,
      poll,
    });
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

  const reactionMatch = info.pathname.match(/^\/api\/v1\/messages\/([^/]+)\/reactions$/);
  if (info.method === "POST" && reactionMatch && info.status === 200) {
    const messageId = reactionMatch[1];
    const rawBody = (() => {
      try {
        const parsed = JSON.parse(info.body);
        return parsed?.data || parsed;
      } catch {
        return info.body;
      }
    })();
    const conversationId = (rawBody as any)?.conversation_id;
    const reactions = (rawBody as any)?.reactions ?? rawBody;
    console.log(JSON.stringify({ service: "gateway", level: "debug", message: "reaction_updated detected", messageId, conversationId, hasReactions: !!reactions }));
    if (conversationId) {
      broadcastToConversation(conversationId, "reaction_updated", {
        messageId,
        userId: jwtPayload.sub,
        reactions,
      });
      console.log(JSON.stringify({ service: "gateway", level: "info", message: "reaction_updated broadcasted", conversationId, messageId }));
    }
  }

  const pollVoteMatch = info.pathname.match(/^\/api\/v1\/messages\/([^/]+)\/polls\/vote$/);
  if (info.method === "POST" && pollVoteMatch && info.status === 200) {
    const messageId = pollVoteMatch[1];
    const rawBody = (() => {
      try {
        const parsed = JSON.parse(info.body);
        return parsed?.data || parsed;
      } catch {
        return info.body;
      }
    })();
    const conversationId = (rawBody as any)?.conversation_id;
    const poll = (rawBody as any)?.poll ?? rawBody;
    if (conversationId) {
      broadcastToConversation(conversationId, "poll_updated", {
        messageId,
        userId: jwtPayload.sub,
        optionIndex: (rawBody as any)?.optionIndex,
        poll,
      });
      console.log(JSON.stringify({ service: "gateway", level: "info", message: "poll_updated broadcasted", conversationId, messageId }));
    }
  }
}

function broadcastToEvents(event: string, payload: unknown): void {
  if (eventsRoom.size === 0) {
    console.log(JSON.stringify({ service: "gateway", level: "warn", message: "broadcastToEvents: ROOM EMPTY", event }));
    return;
  }
  const message = JSON.stringify({ event, payload });
  let sent = 0;
  for (const ws of eventsRoom) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sent++;
    }
  }
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "broadcastToEvents: sent", event, sent, roomSize: eventsRoom.size }));
}

function onEventsResponse(
  info: ProxyResponse,
  _requestUrl: URL,
  _jwtPayload: JWTPayload,
): void {
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "onEventsResponse called", method: info.method, pathname: info.pathname, status: info.status }));

  // 1. New event: POST /api/v1/events  (201)
  if (info.method === "POST" && info.pathname === "/api/v1/events" && info.status === 201) {
    let payload: any;
    try { const p = JSON.parse(info.body); payload = p?.data || p; } catch { payload = info.body; }
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onEventsResponse: broadcasting new_event", id: payload?.id }));
    broadcastToEvents("new_event", payload);
    return;
  }

  // 2. Update event: PATCH /api/v1/events/:id  (200)
  const updateMatch = info.pathname.match(/^\/api\/v1\/events\/([^/]+)$/);
  if (info.method === "PATCH" && updateMatch && info.status === 200) {
    let payload: any;
    try { const p = JSON.parse(info.body); payload = p?.data || p; } catch { payload = info.body; }
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onEventsResponse: broadcasting event_updated", id: updateMatch[1] }));
    broadcastToEvents("event_updated", payload);
    return;
  }

  // 3. Delete event: DELETE /api/v1/events/:id  (200 | 204)
  const deleteMatch = info.pathname.match(/^\/api\/v1\/events\/([^/]+)$/);
  if (info.method === "DELETE" && deleteMatch && (info.status === 200 || info.status === 204)) {
    const eventId = deleteMatch[1];
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onEventsResponse: broadcasting event_deleted", eventId }));
    broadcastToEvents("event_deleted", { id: eventId });
    return;
  }
}

function onForumResponse(
  info: ProxyResponse,
  requestUrl: URL,
  jwtPayload: JWTPayload,
): void {
  console.log(JSON.stringify({ service: "gateway", level: "info", message: "onForumResponse called", method: info.method, pathname: info.pathname, status: info.status }));
  
  // 1. New question: POST /api/v1/forum/questions
  if (info.method === "POST" && info.pathname === "/api/v1/forum/questions" && info.status === 201) {
    let payload: any;
    try {
      const parsed = JSON.parse(info.body);
      payload = parsed?.data || parsed;
    } catch {
      payload = info.body;
    }
    const subjectId = payload?.subjectId || payload?.subject_id;
    if (subjectId) {
      console.log(JSON.stringify({ service: "gateway", level: "info", message: "onForumResponse: broadcasting new question", subjectId }));
      broadcastToForumSubject(subjectId, "new_question", payload);
    }
    return;
  }

  // 2. New answer: POST /api/v1/forum/questions/:questionId/answers
  const answerMatch = info.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)\/answers$/);
  if (info.method === "POST" && answerMatch && info.status === 201) {
    const questionId = answerMatch[1];
    let payload: any;
    try {
      const parsed = JSON.parse(info.body);
      payload = parsed?.data || parsed;
    } catch {
      payload = info.body;
    }
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onForumResponse: broadcasting new answer", questionId }));
    broadcastToForumQuestion(questionId, "new_answer", payload);
    return;
  }

  // 3. Mark as solution: POST /api/v1/forum/questions/:questionId/solution
  const solutionMatch = info.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)\/solution$/);
  if (info.method === "POST" && solutionMatch && info.status === 200) {
    const questionId = solutionMatch[1];
    let payload: any;
    try {
      const parsed = JSON.parse(info.body);
      payload = parsed?.data || parsed;
    } catch {
      payload = info.body;
    }
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onForumResponse: broadcasting solution marked", questionId }));
    broadcastToForumQuestion(questionId, "question_solved", payload);
    return;
  }

  // 4. Pin/unpin answer: PATCH /api/v1/forum/questions/:questionId/answers/:answerId/pin
  const pinMatch = info.pathname.match(/^\/api\/v1\/forum\/questions\/([^/]+)\/answers\/([^/]+)\/pin$/);
  if (info.method === "PATCH" && pinMatch && info.status === 200) {
    const questionId = pinMatch[1];
    const answerId = pinMatch[2];
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onForumResponse: broadcasting answer pin change", questionId, answerId }));
    broadcastToForumQuestion(questionId, "answer_pin_changed", { questionId, answerId });
    return;
  }

  // 5. Vote cast: POST /api/v1/forum/votes
  if (info.method === "POST" && info.pathname === "/api/v1/forum/votes" && info.status === 200) {
    let payload: any;
    try {
      const parsed = JSON.parse(info.body);
      payload = parsed?.data || parsed;
    } catch {
      payload = info.body;
    }
    console.log(JSON.stringify({ service: "gateway", level: "info", message: "onForumResponse: broadcasting vote change", payload }));
    if (payload?.targetType === "question") {
      if (payload.subjectId) {
        broadcastToForumSubject(payload.subjectId, "question_vote_updated", payload);
      }
      broadcastToForumQuestion(payload.targetId, "question_vote_updated", payload);
    } else if (payload?.targetType === "answer") {
      broadcastToForumQuestion(payload.questionId, "answer_vote_updated", payload);
    }
    return;
  }
}

function setCorsHeaders(
  res: NodeServerResponse,
  origin: string,
): boolean {
  const allowedOrigins = [
    "http://localhost:8081",
    "http://localhost:8082",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://192.168.140.38:8081",
    "http://192.168.140.38:8082",
    "https://uniconnect-dashboard-web.fly.dev",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    setHeader(res, "Access-Control-Allow-Origin", origin);
    setHeader(res, "Access-Control-Allow-Credentials", "true");
    setHeader(res, "Vary", "Origin");
    return true;
  }
  return false;
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

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CORS headers on every response (including errors, health, docs)
  // ──────────────────────────────────────────────────────────────────────────
  setCorsHeaders(res, origin);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Preflight (always returns 204, no auth required)
  // ──────────────────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Public paths (docs, OpenAPI spec)
  // ──────────────────────────────────────────────────────────────────────────
  if (PUBLIC_PATHS.has(requestUrl.pathname) || requestUrl.pathname === "/docs" || requestUrl.pathname.startsWith("/docs/")) {
    handleDocsRequest(requestUrl, res);
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Health endpoint (no auth)
  // ──────────────────────────────────────────────────────────────────────────
  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, getHealthPayload(appVersion));
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Token extraction from cookie (fallback if no Authorization header)
  // ──────────────────────────────────────────────────────────────────────────
  if (!req.headers.authorization) {
    const token = jwtMiddleware.getToken(req);
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Auth routes (proxied without JWT validation)
  // ──────────────────────────────────────────────────────────────────────────
  if (isAuthRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.authBaseUrl, "/api/v1/auth");
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. JWT authentication for all other API routes
  // ──────────────────────────────────────────────────────────────────────────
  const payload = jwtMiddleware.authenticate(req, res);
  if (!payload) {
    return;
  }

  if (payload.sub) {
    req.headers["x-user-id"] = payload.sub;
  }

  if (payload.role) {
    req.headers["x-user-role"] = payload.role;
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

  if (isPollRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.messagingBaseUrl);
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
    await proxyRequest(req, res, env.eventsBaseUrl, undefined, (info) => {
      onEventsResponse(info, requestUrl, payload);
    });
    return;
  }

  if (isForumRoute(requestUrl.pathname)) {
    await proxyRequest(req, res, env.forumBaseUrl, undefined, (info) => {
      onForumResponse(info, requestUrl, payload);
    });
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
