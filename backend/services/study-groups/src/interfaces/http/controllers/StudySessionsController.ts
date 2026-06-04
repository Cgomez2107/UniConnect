import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreateStudySessionSeries } from "../../../application/use-cases/CreateStudySessionSeries.js";
import type { CancelStudySession } from "../../../application/use-cases/CancelStudySession.js";
import type { ListStudySessions } from "../../../application/use-cases/ListStudySessions.js";
import type { UpdateAvailability } from "../../../application/use-cases/UpdateAvailability.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

export class StudySessionsController {
  constructor(
    private readonly seriesUseCase: CreateStudySessionSeries,
    private readonly cancelSessionUseCase: CancelStudySession,
    private readonly listSessionsUseCase: ListStudySessions,
    private readonly updateAvailabilityUseCase: UpdateAvailability,
  ) {}

  async handleCreateSeries(req: IncomingMessage, res: ServerResponse, groupId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      const body = await readJsonBody(req) as Record<string, unknown>;
      if (!body) {
        sendError(res, 400, "Invalid JSON body");
        return;
      }

      const input = {
        actorUserId,
        requestId: groupId,
        title: String(body.title || ""),
        description: String(body.description || ""),
        startTime: String(body.startTime || ""),
        endTime: String(body.endTime || ""),
        rrule: body.rrule ? String(body.rrule) : undefined,
        weekCount: typeof body.weekCount === "number" ? body.weekCount : 8,
      };

      const sessions = await this.seriesUseCase.execute(input);
      sendData(res, 201, sessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create session series";
      sendError(res, 400, message);
    }
  }

  async handleListByGroup(req: IncomingMessage, res: ServerResponse, groupId: string): Promise<void> {
    try {
      const requestUrl = new URL(req.url ?? "/", "http://localhost");
      const from = requestUrl.searchParams.get("from") ?? undefined;
      const to = requestUrl.searchParams.get("to") ?? undefined;

      const sessions = await this.listSessionsUseCase.execute({ groupId, from, to });
      sendData(res, 200, sessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list sessions";
      sendError(res, 400, message);
    }
  }

  async handleCancel(req: IncomingMessage, res: ServerResponse, sessionId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      const session = await this.cancelSessionUseCase.execute(sessionId, actorUserId);
      sendData(res, 200, session);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel session";
      if (message.includes("not found")) {
        sendError(res, 404, message);
      } else if (message.includes("already cancelled")) {
        sendError(res, 409, message);
      } else {
        sendError(res, 400, message);
      }
    }
  }

  async handleUpdateAvailability(req: IncomingMessage, res: ServerResponse, sessionId: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      const body = await readJsonBody(req) as { status?: string; userName?: string };
      if (!body || !body.status) {
        sendError(res, 400, "Status is required (confirmed or declined)");
        return;
      }

      if (body.status !== "confirmed" && body.status !== "declined") {
        sendError(res, 400, "Status must be either 'confirmed' or 'declined'");
        return;
      }

      // Use userName from body or default to "Usuario"
      const userName = body.userName || "Usuario";

      const attendee = await this.updateAvailabilityUseCase.execute(
        sessionId,
        actorUserId,
        userName,
        body.status as "confirmed" | "declined",
      );

      sendData(res, 200, attendee);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update availability";
      if (message.includes("not found")) {
        sendError(res, 404, message);
      } else if (message.includes("not a member")) {
        sendError(res, 403, message);
      } else {
        sendError(res, 400, message);
      }
    }
  }
}
