import type { IncomingMessage, ServerResponse } from "node:http";

import { ApplyToStudyRequest } from "../../../application/use-cases/ApplyToStudyRequest.js";
import { AcceptAdminTransfer } from "../../../application/use-cases/AcceptAdminTransfer.js";
import { CreateStudyRequest } from "../../../application/use-cases/CreateStudyRequest.js";
import { GetStudyRequestById } from "../../../application/use-cases/GetStudyRequestById.js";
import { ListApplicationsByRequest } from "../../../application/use-cases/ListApplicationsByRequest.js";
import { ListStudyGroupMessages } from "../../../application/use-cases/ListStudyGroupMessages.js";
import { ListUserNotifications } from "../../../application/use-cases/ListUserNotifications.js";
import { ListMembersByRequest } from "../../../application/use-cases/ListMembersByRequest.js";
import { ListOpenStudyRequests } from "../../../application/use-cases/ListOpenStudyRequests.js";
import { LeaveAdminRole } from "../../../application/use-cases/LeaveAdminRole.js";
import { RequestAdminTransfer } from "../../../application/use-cases/RequestAdminTransfer.js";
import { ReviewApplication } from "../../../application/use-cases/ReviewApplication.js";
import { CreateStudyGroupMessage } from "../../../application/use-cases/CreateStudyGroupMessage.js";
import type { ApplyToStudyGroupDto } from "../dto/ApplyToStudyGroupDto.js";
import type { CreateStudyGroupMessageDto } from "../dto/CreateStudyGroupMessageDto.js";
import type { CreateStudyGroupDto } from "../dto/CreateStudyGroupDto.js";
import type { RequestAdminTransferDto } from "../dto/RequestAdminTransferDto.js";
import type { ReviewApplicationDto } from "../dto/ReviewApplicationDto.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { DtoValidationError, Validators, validateDto } from "../../../../../../shared/libs/validation/index.js";
import { sendData, sendError, sendJson } from "../../../../../../shared/http/sendJson.js";

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
    private readonly leaveAdminRole: LeaveAdminRole,
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

    const body = await readJsonBody<CreateStudyGroupDto>(req);
    try {
      const created = await this.createStudyRequest.execute({
        actorUserId,
        subjectId: body.subjectId ?? "",
        title: body.title ?? "",
        description: body.description ?? "",
        maxMembers: body.maxMembers ?? Number.NaN,
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
    const pageSize = limitRaw ? Math.min(50, Math.max(1, Number(limitRaw))) : 20;

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
      validateDto(
        body,
        {
          content: [(value) => Validators.required(value, "content")],
        },
      );

      const created = await this.createStudyGroupMessage.execute({
        requestId,
        actorUserId,
        content: body.content as string,
      });

      sendData(res, 201, created);
    } catch (error) {
      if (error instanceof DtoValidationError) {
        sendJson(res, 400, { error: error.message, fields: error.fields });
        return;
      }

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

    const body = await readJsonBody<ApplyToStudyGroupDto>(req);
    try {
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

    const body = await readJsonBody<ReviewApplicationDto>(req);
    try {
      validateDto(
        body,
        {
          status: [
            (value) => Validators.required(value, "status"),
            (value) => Validators.oneOf(value, ["aceptada", "rechazada"], "status"),
          ],
        },
      );

      const validatedStatus = body.status as "aceptada" | "rechazada";

      await this.reviewApplication.execute({
        applicationId,
        actorUserId,
        status: validatedStatus,
      });

      sendData(res, 200, { message: "Postulación revisada correctamente." });
    } catch (error) {
      if (error instanceof DtoValidationError) {
        sendJson(res, 400, { error: error.message, fields: error.fields });
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

    const body = await readJsonBody<RequestAdminTransferDto>(req);

    try {
      validateDto(
        body,
        {
          targetUserId: [(value) => Validators.required(value, "targetUserId")],
        },
      );

      const created = await this.requestAdminTransfer.execute({
        requestId,
        actorUserId,
        targetUserId: body.targetUserId as string,
      });

      sendData(res, 201, created);
    } catch (error) {
      if (error instanceof DtoValidationError) {
        sendJson(res, 400, { error: error.message, fields: error.fields });
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
}