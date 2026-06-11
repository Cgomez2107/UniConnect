import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool } from "pg";
import type { GetAllEvents } from "../../../application/use-cases/GetAllEvents.js";
import type { GetUpcomingEvents } from "../../../application/use-cases/GetUpcomingEvents.js";
import type { GetEventById } from "../../../application/use-cases/GetEventById.js";
import type { CreateEvent } from "../../../application/use-cases/CreateEvent.js";
import type { UpdateEvent } from "../../../application/use-cases/UpdateEvent.js";
import type { DeleteEvent } from "../../../application/use-cases/DeleteEvent.js";
import type { PublishEvent } from "../../../application/use-cases/PublishEvent.js";
import type { CancelEvent } from "../../../application/use-cases/CancelEvent.js";
import type { FinishEvent } from "../../../application/use-cases/FinishEvent.js";
import type { RegisterForEvent } from "../../../application/use-cases/RegisterForEvent.js";
import type { UnregisterFromEvent } from "../../../application/use-cases/UnregisterFromEvent.js";
import type { EventStatus } from "../../../domain/state/EventStatus.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { isAdminUser } from "../middlewares/isAdminUser.js";
import { requireRole } from "../../../../../../shared/middleware/adminGuard.js";
import { AuthorizationError } from "../../../../../../shared/libs/errors/AuthorizationError.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

export class EventsController {
  constructor(
    private readonly pool: Pool,
    private readonly getAllEvents: GetAllEvents,
    private readonly getUpcomingEvents: GetUpcomingEvents,
    private readonly getEventById: GetEventById,
    private readonly createEvent: CreateEvent,
    private readonly updateEvent: UpdateEvent,
    private readonly deleteEvent: DeleteEvent,
    private readonly publishEvent: PublishEvent,
    private readonly cancelEvent: CancelEvent,
    private readonly finishEvent: FinishEvent,
    private readonly registerForEvent: RegisterForEvent,
    private readonly unregisterFromEvent: UnregisterFromEvent,
  ) {}

  async list(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const upcoming = requestUrl.searchParams.get("upcoming") === "true";
    const page = parseInt(requestUrl.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(requestUrl.searchParams.get("limit") ?? "20", 10);
    const includeDeleted = requestUrl.searchParams.get("include_deleted") === "true";
    const createdBy = requestUrl.searchParams.get("created_by") ?? requestUrl.searchParams.get("createdBy") ?? undefined;

    const isAdmin = await isAdminUser(req, this.pool);
    const effectiveIncludeDeleted = isAdmin ? includeDeleted : false;

    try {
      if (upcoming) {
        const result = await this.getUpcomingEvents.execute(limit);
        sendData(res, 200, result, { total: result.length });
      } else {
        // Public feed (no createdBy, non-admin): published + cancelled visible
        // Private feed (createdBy set): all statuses for that user
        // Admin feed (isAdmin): all statuses
        let statusFilter: EventStatus | EventStatus[] | undefined;
        if (effectiveIncludeDeleted) {
          statusFilter = undefined;
        } else if (createdBy) {
          statusFilter = undefined;
        } else if (isAdmin) {
          statusFilter = undefined;
        } else {
          statusFilter = ["published", "cancelled"];
        }

        const result = await this.getAllEvents.execute(page, limit, effectiveIncludeDeleted, statusFilter, createdBy);
        sendData(res, 200, result.data, {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        });
      }
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getById(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);

      if (actorUserId) {
        const result = await this.getEventById.getWithRegistrationStatus(eventId, actorUserId);
        if (!result) {
          sendError(res, 404, "Event not found");
          return;
        }
        sendData(res, 200, { ...result.event, isRegistered: result.isRegistered });
      } else {
        const event = await this.getEventById.execute(eventId);
        if (!event) {
          sendError(res, 404, "Event not found");
          return;
        }
        sendData(res, 200, event);
      }
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

    try {
      const body = (req as any).__validatedBody ?? await readJsonBody<any>(req);

      const eventDate = body.event_date || body.eventDate || body.startAt || "";

      const result = await this.createEvent.execute({
        actorUserId,
        title: body.title ?? "",
        description: body.description ?? "",
        location: body.location ?? "",
        startAt: eventDate,
        endAt: body.end_at || body.endAt || "",
        category: body.category || "academico",
        imageUrl: body.imageUrl || body.image_url || "",
        maxCapacity: (() => {
          const raw = body.maxCapacity ?? body.max_capacity ?? body.capacity;
          const num = Number(raw);
          return raw == null ? null : (Number.isFinite(num) ? num : null);
        })(),
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

    try {
      const body = (req as any).__validatedBody ?? await readJsonBody<any>(req);

      const result = await this.updateEvent.execute({
        actorUserId,
        eventId,
        isAdmin: await isAdminUser(req, this.pool),
        title: body.title,
        description: body.description,
        location: body.location,
        startAt: body.startAt ?? body.eventDate ?? body.event_date,
        endAt: body.endAt ?? body.end_at,
        category: body.category,
        imageUrl: body.imageUrl ?? body.image_url,
        maxCapacity: body.maxCapacity ?? body.max_capacity ?? body.capacity,
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

    try {
      const isAdmin = await isAdminUser(req, this.pool);
      if (!isAdmin) {
        requireRole("admin")(req, res);
        return;
      }
      await this.deleteEvent.execute({
        eventId,
        isAdmin: true,
      });
      sendData(res, 200, { message: "Event deleted successfully" });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async register(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      await this.registerForEvent.execute({
        eventId,
        userId: actorUserId,
      });
      sendData(res, 200, { message: "Inscripción exitosa" });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async unregister(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      await this.unregisterFromEvent.execute({
        eventId,
        userId: actorUserId,
      });
      sendData(res, 200, { message: "Cancelación exitosa" });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async publish(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      const result = await this.publishEvent.execute({
        actorUserId,
        eventId,
        isAdmin: await isAdminUser(req, this.pool),
      });
      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async cancel(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      const result = await this.cancelEvent.execute({
        actorUserId,
        eventId,
        isAdmin: await isAdminUser(req, this.pool),
      });
      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async finish(req: IncomingMessage, res: ServerResponse, eventId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Authentication required");
      return;
    }

    try {
      const result = await this.finishEvent.execute({
        actorUserId,
        eventId,
        isAdmin: await isAdminUser(req, this.pool),
      });
      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
