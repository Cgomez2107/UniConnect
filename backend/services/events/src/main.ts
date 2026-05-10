import { createServer } from "node:http";
import { createHash } from "node:crypto";
import type { Duplex } from "node:stream";
import { GetAllEvents } from "./application/use-cases/GetAllEvents.js";
import { GetUpcomingEvents } from "./application/use-cases/GetUpcomingEvents.js";
import { GetEventById } from "./application/use-cases/GetEventById.js";
import { CreateEvent } from "./application/use-cases/CreateEvent.js";
import { UpdateEvent } from "./application/use-cases/UpdateEvent.js";
import { DeleteEvent } from "./application/use-cases/DeleteEvent.js";
import { loadEventsEnv } from "./config/env.js";
import { PostgresEventRepository } from "./infrastructure/database/PostgresEventRepository.js";
import { PostgresSubscriptionRepository } from "./infrastructure/database/PostgresSubscriptionRepository.js";
import { Database } from "./infrastructure/database/Database.js";
import { UniversityEventSubject } from "./domain/events/UniversityEventSubject.js";
import { UniversityEventObserver } from "./domain/events/UniversityEventObserver.js";
import { EventsController } from "./interfaces/http/controllers/EventsController.js";
import { SubscriptionController } from "./interfaces/http/controllers/SubscriptionController.js";
import { handleEventsRoutes } from "./interfaces/http/routes/eventsRoutes.js";
import type { IEventSocketGateway } from "./domain/events/UniversityEventObserver.js";

const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function encodeWebSocketTextFrame(message: string): Buffer {
  const payload = Buffer.from(message, "utf-8");

  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  }

  if (payload.length < 65_536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, payload]);
}

class InMemoryWebSocketGateway implements IEventSocketGateway {
  private readonly socketsByUser = new Map<string, Set<Duplex>>();

  register(userId: string, socket: Duplex): void {
    if (!this.socketsByUser.has(userId)) {
      this.socketsByUser.set(userId, new Set());
    }

    const sockets = this.socketsByUser.get(userId)!;
    sockets.add(socket);

    const cleanup = () => {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.socketsByUser.delete(userId);
      }
    };

    socket.on("close", cleanup);
    socket.on("end", cleanup);
    socket.on("error", cleanup);
  }

  async emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets || sockets.size === 0) {
      return;
    }

    const message = JSON.stringify({ event, userId, payload });
    const frame = encodeWebSocketTextFrame(message);

    for (const socket of sockets) {
      if (!socket.destroyed) {
        socket.write(frame);
      }
    }
  }
}

function acceptWebSocketConnection(req: import("node:http").IncomingMessage, socket: Duplex, gateway: InMemoryWebSocketGateway): void {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  if (requestUrl.pathname !== "/ws/events") {
    socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  const userId = requestUrl.searchParams.get("userId") ?? (typeof req.headers["x-user-id"] === "string" ? req.headers["x-user-id"] : null);
  const websocketKey = req.headers["sec-websocket-key"];

  if (!userId || typeof websocketKey !== "string") {
    socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  const acceptKey = createHash("sha1").update(`${websocketKey}${WEBSOCKET_GUID}`).digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "",
      "",
    ].join("\r\n"),
  );

  gateway.register(userId, socket);
  const wsSocket = socket as Duplex & { setNoDelay?: () => void };
  if (typeof wsSocket.setNoDelay === "function") {
    wsSocket.setNoDelay();
  }

  socket.on("data", chunk => {
    if (chunk.length > 0 && (chunk[0] & 0x0f) === 0x8) {
      socket.end();
    }
  });
}

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function bootstrap(): void {
  const env = loadEventsEnv();

  // Inicialización del Singleton de BD
  const pool = Database.getInstance(env).getPool();

  // Repositorio con inyección de dependencia
  const repository = new PostgresEventRepository(pool);
  const subscriptionRepository = new PostgresSubscriptionRepository(pool);

  // Sistema de eventos (Observer Pattern)
  const subject = new UniversityEventSubject();
  const socketGateway = new InMemoryWebSocketGateway();
  const eventObserver = new UniversityEventObserver(subscriptionRepository, socketGateway);
  subject.subscribe(eventObserver);

  const getAllEvents = new GetAllEvents(repository);
  const getUpcomingEvents = new GetUpcomingEvents(repository);
  const getEventById = new GetEventById(repository);
  const createEvent = new CreateEvent(repository, subject);
  const updateEvent = new UpdateEvent(repository);
  const deleteEvent = new DeleteEvent(repository);

  const controller = new EventsController(
    getAllEvents,
    getUpcomingEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
  );

  const subscriptionController = new SubscriptionController(subscriptionRepository);

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleEventsRoutes(req, res, controller, subscriptionController);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"),
      );
    });
  });

  server.on("upgrade", (req, socket, head) => {
    if (head.length > 0) {
      socket.unshift(head);
    }

    acceptWebSocketConnection(req, socket, socketGateway);
  });

  (server as any).listen({ port: env.port, host: "::" }, () => {
    console.log(
      JSON.stringify({
        service: "events",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "::",
        nodeEnv: env.nodeEnv,
      }),
    );
  });

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio events...`);

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
    });

    try {
      await Database.getInstance().close();
      console.log("[Shutdown] Limpieza de recursos completada con éxito.");
      process.exit(0);
    } catch (error) {
      console.error("[Shutdown] Error durante el cierre de recursos:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap();
