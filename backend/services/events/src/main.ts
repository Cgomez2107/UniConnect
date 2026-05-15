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
import { SupabaseRealtimeEventGateway } from "./infrastructure/realtime/SupabaseRealtimeEventGateway.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

async function ensureEventSubscriptionsTable(pool: import("pg").Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_subscriptions (
        user_id    VARCHAR(255) NOT NULL,
        category   VARCHAR(50)  NOT NULL,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, category)
      );
      CREATE INDEX IF NOT EXISTS idx_event_subscriptions_category
        ON event_subscriptions (category);
    `);
    console.log(JSON.stringify({ service: "events", level: "info", message: "Table event_subscriptions ensured" }));
  } catch (error) {
    console.error(JSON.stringify({ service: "events", level: "error", message: "Failed to ensure event_subscriptions table", error: (error as Error).message }));
  }
}

function bootstrap(): void {
  const env = loadEventsEnv();

  // Inicialización del Singleton de BD
  const pool = Database.getInstance(env).getPool();

  // Asegurar tabla event_subscriptions
  void ensureEventSubscriptionsTable(pool);

  // Repositorio con inyección de dependencia
  const repository = new PostgresEventRepository(pool);
  const subscriptionRepository = new PostgresSubscriptionRepository(pool);

  // Sistema de eventos (Observer Pattern)
  const subject = new UniversityEventSubject();
  const socketGateway = env.supabaseUrl && env.supabaseServiceRoleKey
    ? new SupabaseRealtimeEventGateway(env.supabaseUrl, env.supabaseServiceRoleKey)
    : null;
  if (!socketGateway) {
    console.warn(JSON.stringify({ service: "events", level: "warn", message: "Supabase credentials missing; events will not emit real-time notifications" }));
  }
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
      if (socketGateway && typeof (socketGateway as any).dispose === "function") {
        (socketGateway as any).dispose();
      }
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
