import type { IncomingMessage, ServerResponse } from "node:http";
import type { GetAllEvents } from "../../../application/use-cases/GetAllEvents.js";
import type { GetUpcomingEvents } from "../../../application/use-cases/GetUpcomingEvents.js";
import type { GetEventById } from "../../../application/use-cases/GetEventById.js";
import type { CreateEvent } from "../../../application/use-cases/CreateEvent.js";
import type { UpdateEvent } from "../../../application/use-cases/UpdateEvent.js";
import type { DeleteEvent } from "../../../application/use-cases/DeleteEvent.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { isAdminUser } from "../middlewares/isAdminUser.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

/**
 * Controlador HTTP del dominio events
 */
export class EventsController {
  constructor(
    private readonly getAllEvents: GetAllEvents,
    private readonly getUpcomingEvents: GetUpcomingEvents,
    private readonly getEventById: GetEventById,
    private readonly createEvent: CreateEvent,
    private readonly updateEvent: UpdateEvent,
    private readonly deleteEvent: DeleteEvent,
  ) {}

  async list(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const upcoming = requestUrl.searchParams.get("upcoming") === "true";

    try {
      const result = upcoming
        ? await this.getUpcomingEvents.execute(20)
        : await this.getAllEvents.execute();

      sendJson(res, 200, { data: result, meta: { total: result.length } });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async getById(_req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    try {
      const result = await this.getEventById.execute(eventId);

      if (!result) {
        sendJson(res, 404, { error: "Event not found" });
        return;
      }

      sendJson(res, 200, { data: result });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async create(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Authentication required" });
      return;
    }

    if (!isAdminUser(req)) {
      sendJson(res, 403, { error: "Only admins can create events" });
      return;
    }

    try {
      const body = await readJsonBody<any>(req);

      const result = await this.createEvent.execute({
        actorUserId,
        title: body.title ?? "",
        description: body.description ?? "",
        location: body.location ?? "",
        startAt: body.startAt ?? "",
        endAt: body.endAt ?? "",
        maxCapacity: body.maxCapacity,
      });

      sendJson(res, 201, { data: result });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async update(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Authentication required" });
      return;
    }

    if (!isAdminUser(req)) {
      sendJson(res, 403, { error: "Only admins can update events" });
      return;
    }

    try {
      const body = await readJsonBody<any>(req);

      const result = await this.updateEvent.execute({
        actorUserId,
        eventId,
        title: body.title,
        description: body.description,
        location: body.location,
        startAt: body.startAt,
        endAt: body.endAt,
        maxCapacity: body.maxCapacity,
      });

      sendJson(res, 200, { data: result });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async delete(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendJson(res, 401, { error: "Authentication required" });
      return;
    }

    if (!isAdminUser(req)) {
      sendJson(res, 403, { error: "Only admins can delete events" });
      return;
    }

    try {
      await this.deleteEvent.execute({ eventId, actorUserId });
      sendJson(res, 200, { message: "Event deleted successfully" });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }
}
