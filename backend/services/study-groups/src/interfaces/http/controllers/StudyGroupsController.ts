import type { IncomingMessage, ServerResponse } from "node:http";
import { z, ZodError } from "zod";

import { ApplyToStudyRequest } from "../../../application/use-cases/ApplyToStudyRequest.js";
import { AcceptAdminTransfer } from "../../../application/use-cases/AcceptAdminTransfer.js";
import { CancelMyApplication } from "../../../application/use-cases/CancelMyApplication.js";
import { CancelStudyRequest } from "../../../application/use-cases/CancelStudyRequest.js";
import { CreateStudyRequest } from "../../../application/use-cases/CreateStudyRequest.js";
import { GetStudyRequestById } from "../../../application/use-cases/GetStudyRequestById.js";
import { ListApplicationsByRequest } from "../../../application/use-cases/ListApplicationsByRequest.js";
import { ListStudyGroupMessages } from "../../../application/use-cases/ListStudyGroupMessages.js";
import { ListUserNotifications } from "../../../application/use-cases/ListUserNotifications.js";
import { MarkAllNotificationsAsRead } from "../../../application/use-cases/MarkAllNotificationsAsRead.js";
import { ListMembersByRequest } from "../../../application/use-cases/ListMembersByRequest.js";
import { ListOpenStudyRequests } from "../../../application/use-cases/ListOpenStudyRequests.js";
import { ListMyStudyRequests } from "../../../application/use-cases/ListMyStudyRequests.js";
import { ListMyApplications } from "../../../application/use-cases/ListMyApplications.js";
import { LeaveAdminRole } from "../../../application/use-cases/LeaveAdminRole.js";
import { RejectAdminTransfer } from "../../../application/use-cases/RejectAdminTransfer.js";
import { RequestAdminTransfer } from "../../../application/use-cases/RequestAdminTransfer.js";
import { ReviewApplication } from "../../../application/use-cases/ReviewApplication.js";
import { CreateStudyGroupMessage } from "../../../application/use-cases/CreateStudyGroupMessage.js";
import { ToggleStudyGroupMessageReaction } from "../../../application/use-cases/ToggleStudyGroupMessageReaction.js";
import { VoteInPoll } from "../../../application/use-cases/VoteInPoll.js";
import { CreateStudySession } from "../../../application/use-cases/CreateStudySession.js";
import { CancelStudySession } from "../../../application/use-cases/CancelStudySession.js";
import { UpdateAvailability } from "../../../application/use-cases/UpdateAvailability.js";
import { ListSessionsByGroup } from "../../../application/use-cases/ListSessionsByGroup.js";
import type { CreateStudyGroupMessageDto } from "../dto/CreateStudyGroupMessageDto.js";
import type { CreateSessionDto } from "../dto/CreateSessionDto.js";
import type { UpdateAvailabilityDto } from "../dto/UpdateAvailabilityDto.js";
import { CreateGroupRequestSchema } from "@uniconnect/shared-types/contracts/study-group";
import type { CreateGroupRequest } from "@uniconnect/shared-types/contracts/study-group";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { validateBody } from "../../../middleware/validationMiddleware.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError, sendJson } from "../../../../../../shared/http/sendJson.js";
import type { ApplyToStudyGroupDto } from "../dto/ApplyToStudyGroupDto.js";
import type { PreferenceService } from "../../../application/services/PreferenceService.js";

const UpdatePreferenceBodySchema = z.object({
  eventType: z.string().min(1),
  canal: z.string().min(1),
  active: z.boolean(),
});

const ReviewApplicationBodySchema = z.object({
  status: z.enum(["aceptada", "rechazada"]),
});

const RequestTransferBodySchema = z.object({
  targetUserId: z.string().min(1),
});

/**
 * Controlador HTTP del dominio study-groups.
 *
 * Responsabilidad única: traducir la solicitud HTTP a llamadas de casos de uso
 * y serializar la respuesta. No contiene lógica de negocio.
 *
 * Aplica el patrón Facade: oculta la complejidad de los casos de uso
 * detrás de métodos de alto nivel que el router puede invocar directamente.
 *
 * Las dependencias se inyectan en el constructor (Dependency Injection),
 * lo que facilita el reemplazo de implementaciones en tests y migraciones.
 */
export class StudyGroupsController {
  constructor(
    private readonly listOpenStudyRequests: ListOpenStudyRequests,
    private readonly getStudyRequestById: GetStudyRequestById,
    private readonly createStudyRequest: CreateStudyRequest,
    private readonly listMembersByRequest: ListMembersByRequest,
    private readonly listApplicationsByRequest: ListApplicationsByRequest,
    private readonly listStudyGroupMessages: ListStudyGroupMessages,
    private readonly createStudyGroupMessage: CreateStudyGroupMessage,
    private readonly listUserNotifications: ListUserNotifications,
    private readonly applyToStudyRequest: ApplyToStudyRequest,
    private readonly reviewApplication: ReviewApplication,
    private readonly requestAdminTransfer: RequestAdminTransfer,
    private readonly acceptAdminTransfer: AcceptAdminTransfer,
    private readonly rejectAdminTransfer: RejectAdminTransfer,
    private readonly leaveAdminRole: LeaveAdminRole,
    private readonly listMyStudyRequestsUC: ListMyStudyRequests,
    private readonly listMyApplicationsUC: ListMyApplications,
    private readonly cancelStudyRequestUC: CancelStudyRequest,
    private readonly cancelMyApplicationUC: CancelMyApplication,
    private readonly toggleStudyGroupMessageReaction: ToggleStudyGroupMessageReaction,
    private readonly voteInPoll: VoteInPoll,
    private readonly markAllNotificationsAsRead: MarkAllNotificationsAsRead,
    private readonly preferenceService: PreferenceService,
    private readonly createStudySessionUC: CreateStudySession,
    private readonly cancelStudySessionUC: CancelStudySession,
    private readonly updateAvailabilityUC: UpdateAvailability,
    private readonly listSessionsByGroupUC: ListSessionsByGroup,
  ) { }

  async list(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");

    const subjectIdsRaw = requestUrl.searchParams.get("subjectIds");
    const subjectIds = subjectIdsRaw
      ? subjectIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const pageRaw = requestUrl.searchParams.get("page");
    const limitRaw = requestUrl.searchParams.get("limit");

    const page = pageRaw ? Math.max(0, Number(pageRaw) - 1) : 0;
    const pageSize = limitRaw ? Math.min(50, Math.max(1, Number(limitRaw))) : 10;

    try {
      const result = await this.listOpenStudyRequests.execute({
        subjectId: requestUrl.searchParams.get("subjectId") ?? undefined,
        subjectIds,
        search: requestUrl.searchParams.get("search") ?? undefined,
        page,
        pageSize,
      });

      sendData(res, 200, result, { total: result.length, page, pageSize });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getById(_req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const result = await this.getStudyRequestById.execute(id);

      if (!result) {
        sendError(res, 404, "Solicitud de estudio no encontrada.");
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
      sendError(res, 401, "Token de autenticación requerido.");
      return;
    }

    const body = await readJsonBody<ApplyToStudyGroupDto>(req);
    try {
      const parsed = validateBody<CreateGroupRequest["body"]>(CreateGroupRequestSchema.shape.body, body, res);
      if (!parsed) {
        return;
      }

      const created = await this.createStudyRequest.execute({
        actorUserId,
        subjectId: parsed.subjectId,
        title: parsed.name,
        description: parsed.description,
        maxMembers: parsed.maxMembers,
      });

      sendData(res, 201, created);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listApplications(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticación requerido.");
      return;
    }

    try {
      const applications = await this.listApplicationsByRequest.execute({
        requestId,
        actorUserId,
      });

      sendData(res, 200, applications, { total: applications.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listMessages(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const pageRaw = requestUrl.searchParams.get("page");
    const limitRaw = requestUrl.searchParams.get("limit");

    const page = pageRaw ? Math.max(0, Number(pageRaw) - 1) : 0;
    const pageSize = limitRaw ? Math.min(200, Math.max(1, Number(limitRaw))) : 50;

    try {
      const messages = await this.listStudyGroupMessages.execute({
        requestId,
        actorUserId,
        page,
        pageSize,
      });

      sendData(res, 200, messages, { total: messages.length, page, pageSize });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async createMessage(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const body = await readJsonBody<CreateStudyGroupMessageDto>(req);

    try {
      // Validar que al menos haya texto o un archivo
      if (!body.content && !body.mediaUrl) {
        sendError(res, 400, "El mensaje debe contener texto o un archivo adjunto.");
        return;
      }

      const created = await this.createStudyGroupMessage.execute({
        requestId,
        actorUserId,
        content: body.content || "",
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType,
        mediaFilename: body.mediaFilename,
        mentions: body.mentions,
        poll: body.poll,
      });

      sendData(res, 201, created);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listNotifications(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const pageRaw = requestUrl.searchParams.get("page");
    const limitRaw = requestUrl.searchParams.get("limit");

    const page = pageRaw ? Math.max(0, Number(pageRaw) - 1) : 0;
    const pageSize = limitRaw ? Math.min(50, Math.max(1, Number(limitRaw))) : 20;

    try {
      const notifications = await this.listUserNotifications.execute({
        actorUserId,
        page,
        pageSize,
      });

      sendData(res, 200, notifications, { total: notifications.length, page, pageSize });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async markNotificationsRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      await this.markAllNotificationsAsRead.execute(actorUserId);
      sendData(res, 200, { success: true });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getPreferences(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const eventTypes = [
        "solicitud_ingreso",
        "miembro_aceptado",
        "miembro_rechazado",
        "transferencia_admin_solicitada",
        "transferencia_admin_aceptada",
        "transferencia_admin_rechazada",
        "transferencia_admin_transferida",
        "admin_role_left",
        "nuevo_evento",
      ] as const;

      const labels: Record<string, string> = {
        solicitud_ingreso: "Solicitud de ingreso",
        miembro_aceptado: "Miembro aceptado",
        miembro_rechazado: "Miembro rechazado",
        transferencia_admin_solicitada: "Transferencia de admin solicitada",
        transferencia_admin_aceptada: "Transferencia de admin aceptada",
        transferencia_admin_rechazada: "Transferencia de admin rechazada",
        transferencia_admin_transferida: "Admin transferido",
        admin_role_left: "Admin renunció",
        nuevo_evento: "Nuevo evento universitario",
      };

      const results = await Promise.allSettled(
        eventTypes.map(async (eventType) => {
          const canales = await this.preferenceService.getCanalesActivos(actorUserId, eventType);
          const channels: Record<string, boolean> = {
            in_app_websocket: canales.includes("in_app_websocket"),
            email_institucional: canales.includes("email_institucional"),
            push_movil: canales.includes("push_movil"),
          };
          return { eventType, label: labels[eventType] ?? eventType, channels };
        }),
      );

      const preferences = results
        .filter((r): r is PromiseFulfilledResult<{ eventType: string; label: string; channels: Record<string, boolean> }> => r.status === "fulfilled")
        .map((r) => r.value);

      sendJson(res, 200, { preferences: preferences ?? [] });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async updatePreference(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const body = await readJsonBody(req);
      const parsed = UpdatePreferenceBodySchema.parse(body);
      await this.preferenceService.setCanalActivo(actorUserId, parsed.eventType, parsed.canal, parsed.active);
      sendJson(res, 200, { message: "Preferencia actualizada correctamente", success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Datos invalidos: " + error.errors.map(e => e.message).join(", "));
        return;
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listMembers(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const members = await this.listMembersByRequest.execute({
        requestId,
        actorUserId,
      });

      sendData(res, 200, members, { total: members.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async apply(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticación requerido.");
      return;
    }

    try {
      const body = await readJsonBody<ApplyToStudyGroupDto>(req);
      const created = await this.applyToStudyRequest.execute({
        requestId,
        applicantId: actorUserId,
        message: body.message ?? "",
        applicantName: body.applicantName,
      });

      sendData(res, 201, created);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async review(
    req: IncomingMessage,
    res: ServerResponse,
    applicationId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticación requerido.");
      return;
    }

    const body = await readJsonBody(req);
    try {
      const parsed = ReviewApplicationBodySchema.parse(body);

      await this.reviewApplication.execute({
        applicationId,
        actorUserId,
        status: parsed.status,
      });

      sendData(res, 200, { message: "Postulación revisada correctamente." });
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Error de validación: el campo 'status' debe ser 'aceptada' o 'rechazada'.");
        return;
      }

      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async requestTransfer(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const body = await readJsonBody(req);

    try {
      const parsed = RequestTransferBodySchema.parse(body);

      const created = await this.requestAdminTransfer.execute({
        requestId,
        actorUserId,
        targetUserId: parsed.targetUserId,
      });

      sendData(res, 201, created);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Error de validación: el campo 'targetUserId' es requerido.");
        return;
      }

      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async acceptTransfer(
    req: IncomingMessage,
    res: ServerResponse,
    transferId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      await this.acceptAdminTransfer.execute({
        transferId,
        actorUserId,
      });

      sendData(res, 200, { message: "Transferencia aceptada correctamente." });
    } catch (error) {
      console.error("Error en acceptAdminTransfer:", error instanceof Error ? error.message : error);
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async rejectTransfer(
    req: IncomingMessage,
    res: ServerResponse,
    transferId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      await this.rejectAdminTransfer.execute({
        transferId,
        actorUserId,
      });

      sendData(res, 200, { message: "Transferencia rechazada correctamente." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async toggleMessageReaction(
    req: IncomingMessage,
    res: ServerResponse,
    messageId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const body = await readJsonBody<{ emoji: string }>(req);
      if (!body.emoji) {
        sendError(res, 400, "El campo 'emoji' es requerido.");
        return;
      }

      const reactions = await this.toggleStudyGroupMessageReaction.execute(messageId, actorUserId, body.emoji);
      sendData(res, 200, { reactions });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async voteInPollHandler(
    req: IncomingMessage,
    res: ServerResponse,
    messageId: string,
  ): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticacion requerido.");
        return;
      }

      const body = await readJsonBody<{ optionIndex: number }>(req);
      if (body.optionIndex === undefined || body.optionIndex < 0) {
        sendError(res, 400, "El campo 'optionIndex' es requerido y debe ser >= 0.");
        return;
      }

      const { requestId, poll } = await this.voteInPoll.execute(
        messageId,
        actorUserId,
        body.optionIndex,
      );

      sendData(res, 200, {
        request_id: requestId,
        message_id: messageId,
        poll,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("cerrada")) {
          sendError(res, 403, error.message);
          return;
        }
        if (msg.includes("no encontrado") || msg.includes("no contiene")) {
          sendError(res, 404, error.message);
          return;
        }
        if (msg.includes("inválida") || msg.includes("opción")) {
          sendError(res, 400, error.message);
          return;
        }
        // Criterio 5: Manejo específico para voto duplicado
        if (msg.includes("ya has registrado") || msg.includes("ya registro")) {
          sendError(res, 400, error.message);
          return;
        }
      }
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async leaveAdmin(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      await this.leaveAdminRole.execute({
        requestId,
        actorUserId,
      });

      sendData(res, 200, { message: "Salida de administracion registrada." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listMyStudyRequests(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      const requests = await this.listMyStudyRequestsUC.execute(actorUserId);
      sendData(res, 200, requests, { total: requests.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listMyApplications(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      const applications = await this.listMyApplicationsUC.execute(actorUserId);
      sendData(res, 200, applications, { total: applications.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async cancelStudyRequest(
    req: IncomingMessage,
    res: ServerResponse,
    requestId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const updated = await this.cancelStudyRequestUC.execute(requestId, actorUserId);
      sendData(res, 200, updated);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async cancelMyApplication(
    req: IncomingMessage,
    res: ServerResponse,
    applicationId: string,
  ): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      await this.cancelMyApplicationUC.execute(applicationId, actorUserId);
      sendData(res, 200, { message: "Postulación cancelada correctamente." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async createSession(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const body = await readJsonBody<CreateSessionDto>(req);
    try {
      if (body.daysOfWeek && body.frequency) {
        if (!body.startDate || !body.time || !body.durationMinutes) {
          sendError(res, 400, "startDate, time, and durationMinutes are required for recurring sessions.");
          return;
        }
        if (!Array.isArray(body.daysOfWeek) || body.daysOfWeek.length === 0) {
          sendError(res, 400, "daysOfWeek must be a non-empty array.");
          return;
        }
        const seriesEndDate = body.seriesEndDate ?? body.endDate;
        const result = await this.createStudySessionUC.executeRecurring({
          actorUserId,
          requestId,
          title: body.title,
          description: body.description,
          startDate: body.startDate,
          endDate: seriesEndDate,
          time: body.time,
          durationMinutes: body.durationMinutes,
          daysOfWeek: body.daysOfWeek,
          frequency: "weekly",
          location: body.location,
          reminderMinutes: body.reminderMinutes,
        });
        sendData(res, 201, result);
      } else {
        if (!body.startTime || !body.durationMinutes) {
          sendError(res, 400, "startTime and durationMinutes are required.");
          return;
        }
        const result = await this.createStudySessionUC.executeSingle({
          actorUserId,
          requestId,
          title: body.title,
          description: body.description,
          startTime: body.startTime,
          durationMinutes: body.durationMinutes,
          location: body.location,
          reminderMinutes: body.reminderMinutes,
        });
        sendData(res, 201, result);
      }
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listSessions(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    try {
      const sessions = await this.listSessionsByGroupUC.execute(requestId, {
        from: requestUrl.searchParams.get("from") ?? undefined,
        to: requestUrl.searchParams.get("to") ?? undefined,
        status: requestUrl.searchParams.get("status") ?? undefined,
      });
      sendData(res, 200, sessions, { total: sessions.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async cancelSession(req: IncomingMessage, res: ServerResponse, sessionId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const result = await this.cancelStudySessionUC.execute(sessionId, actorUserId);
      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async updateAvailability(req: IncomingMessage, res: ServerResponse, sessionId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    const body = await readJsonBody<UpdateAvailabilityDto>(req);
    if (!body.status || !["confirmed", "declined"].includes(body.status)) {
      sendError(res, 400, "status must be 'confirmed' or 'declined'.");
      return;
    }

    try {
      const result = await this.updateAvailabilityUC.execute(
        sessionId,
        actorUserId,
        "",
        body.status,
      );
      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async listSessionAttendees(req: IncomingMessage, res: ServerResponse, sessionId: string): Promise<void> {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      sendError(res, 401, "Token de autenticacion requerido.");
      return;
    }

    try {
      const attendees = await this.listSessionsByGroupUC.listAttendees(sessionId);
      sendData(res, 200, attendees, { total: attendees.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
