import type { IncomingMessage, ServerResponse } from "node:http";

import { CreateStudyResource } from "../../../application/use-cases/CreateStudyResource.js";
import { DeleteStudyResource } from "../../../application/use-cases/DeleteStudyResource.js";
import { GetStudyResourceById } from "../../../application/use-cases/GetStudyResourceById.js";
import { ListStudyResources } from "../../../application/use-cases/ListStudyResources.js";
import { UpdateStudyResource } from "../../../application/use-cases/UpdateStudyResource.js";
import type { CreateResourceDto } from "../dto/CreateResourceDto.js";
import type { UpdateResourceDto } from "../dto/UpdateResourceDto.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

export class ResourcesController {
  constructor(
    private readonly listStudyResources: ListStudyResources,
    private readonly getStudyResourceById: GetStudyResourceById,
    private readonly createStudyResource: CreateStudyResource,
    private readonly updateStudyResource: UpdateStudyResource,
    private readonly deleteStudyResource: DeleteStudyResource,
  ) {}

  async list(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const requestUrl = new URL(req.url ?? "/", "http://localhost");

      const pageRaw = requestUrl.searchParams.get("page");
      const limitRaw = requestUrl.searchParams.get("limit");

      const page = pageRaw ? Math.max(0, Number(pageRaw) - 1) : 0;
      const pageSize = limitRaw ? Math.min(50, Math.max(1, Number(limitRaw))) : 10;

      const result = await this.listStudyResources.execute({
        subjectId: requestUrl.searchParams.get("subjectId") ?? undefined,
        userId: requestUrl.searchParams.get("userId") ?? undefined,
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
      const result = await this.getStudyResourceById.execute(id);

      if (!result) {
        sendError(res, 404, "Recurso no encontrado.");
        return;
      }

      sendData(res, 200, result);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async create(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticación requerido.");
        return;
      }

      const body = await readJsonBody<CreateResourceDto>(req);

      const created = await this.createStudyResource.execute({
        actorUserId,
        programId: body.programId ?? "",
        subjectId: body.subjectId ?? "",
        title: body.title ?? "",
        description: body.description,
        fileUrl: body.fileUrl ?? "",
        fileName: body.fileName ?? "",
        fileType: body.fileType,
        fileSizeKb: body.fileSizeKb,
      });

      sendData(res, 201, created);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async delete(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticación requerido.");
        return;
      }

      const deleted = await this.deleteStudyResource.execute(id, actorUserId);

      if (!deleted) {
        sendError(res, 404, "Recurso no encontrado.");
        return;
      }

      sendData(res, 200, { message: "Recurso eliminado correctamente." });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async update(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticación requerido.");
        return;
      }

      const body = await readJsonBody<UpdateResourceDto>(req);
      const updated = await this.updateStudyResource.execute(id, actorUserId, {
        title: body.title,
        description: body.description,
      });

      if (!updated) {
        sendError(res, 404, "Recurso no encontrado.");
        return;
      }

      sendData(res, 200, updated);
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
