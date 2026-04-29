import { createServer } from "node:http";
import { GetAllEvents } from "./application/use-cases/GetAllEvents.js";
import { GetUpcomingEvents } from "./application/use-cases/GetUpcomingEvents.js";
import { GetEventById } from "./application/use-cases/GetEventById.js";
import { CreateEvent } from "./application/use-cases/CreateEvent.js";
import { UpdateEvent } from "./application/use-cases/UpdateEvent.js";
import { DeleteEvent } from "./application/use-cases/DeleteEvent.js";
import { loadEventsEnv } from "./config/env.js";
import { PostgresEventRepository } from "./infrastructure/database/PostgresEventRepository.js";
import { EventsController } from "./interfaces/http/controllers/EventsController.js";
import { handleEventsRoutes } from "./interfaces/http/routes/eventsRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function bootstrap(): void {
  const env = loadEventsEnv();

  const repository = new PostgresEventRepository(env);

  const getAllEvents = new GetAllEvents(repository);
  const getUpcomingEvents = new GetUpcomingEvents(repository);
  const getEventById = new GetEventById(repository);
  const createEvent = new CreateEvent(repository);
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

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleEventsRoutes(req, res, controller);
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

  (server as any).listen({ port: env.port, host: "0.0.0.0" }, () => {
    console.log(
      JSON.stringify({
        service: "events",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "0.0.0.0",
        nodeEnv: env.nodeEnv,
      }),
    );
  });
}

bootstrap();
