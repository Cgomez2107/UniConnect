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
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

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

      sendData(res, 200, result, { total: result.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getById(_req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    try {
      const result = await this.getEventById.execute(eventId);

      if (!result) {
        sendError(res, 404, "Event not found");
        return;
      }

      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async create(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    if (!isAdminUser(req)) {
      sendError(res, 403, "Only admins can create events");
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

      sendData(res, 201, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async update(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    if (!isAdminUser(req)) {
      sendError(res, 403, "Only admins can update events");
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

      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async delete(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    if (!isAdminUser(req)) {
      sendError(res, 403, "Only admins can delete events");
      return;
    }

    try {
      await this.deleteEvent.execute({ eventId, actorUserId });
      sendData(res, 200, { message: "Event deleted successfully" });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
