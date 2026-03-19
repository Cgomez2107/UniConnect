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

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

function mapApplicationError(error: unknown): { statusCode: number; message: string } {
  if (!(error instanceof Error)) {
    return { statusCode: 500, message: "Error interno del servicio." };
  }

  const message = error.message ?? "Error interno del servicio.";

  if (/token de autenticacion requerido/i.test(message)) {
    return { statusCode: 401, message };
  }

  if (/solo el autor puede/i.test(message)) {
    return { statusCode: 403, message };
  }

  if (/obligatorio|debes enviar al menos/i.test(message)) {
    return { statusCode: 400, message };
  }

  return { statusCode: 500, message: "Error interno del servicio." };
}

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

      sendJson(res, 200, {
        data: result,
        meta: { total: result.length, page, pageSize },
      });
    } catch (error) {
      const mapped = mapApplicationError(error);
      sendJson(res, mapped.statusCode, { error: mapped.message });
    }
  }

  async getById(_req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const result = await this.getStudyResourceById.execute(id);

      if (!result) {
        sendJson(res, 404, { error: "Recurso no encontrado." });
        return;
      }

      sendJson(res, 200, { data: result });
    } catch (error) {
      const mapped = mapApplicationError(error);
      sendJson(res, mapped.statusCode, { error: mapped.message });
    }
  }

  async create(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendJson(res, 401, { error: "Token de autenticación requerido." });
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

      sendJson(res, 201, { data: created });
    } catch (error) {
      const mapped = mapApplicationError(error);
      sendJson(res, mapped.statusCode, { error: mapped.message });
    }
  }

  async delete(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendJson(res, 401, { error: "Token de autenticación requerido." });
        return;
      }

      const deleted = await this.deleteStudyResource.execute(id, actorUserId);

      if (!deleted) {
        sendJson(res, 404, { error: "Recurso no encontrado." });
        return;
      }

      sendJson(res, 200, { message: "Recurso eliminado correctamente." });
    } catch (error) {
      const mapped = mapApplicationError(error);
      sendJson(res, mapped.statusCode, { error: mapped.message });
    }
  }

  async update(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendJson(res, 401, { error: "Token de autenticación requerido." });
        return;
      }

      const body = await readJsonBody<UpdateResourceDto>(req);
      const updated = await this.updateStudyResource.execute(id, actorUserId, {
        title: body.title,
        description: body.description,
      });

      if (!updated) {
        sendJson(res, 404, { error: "Recurso no encontrado." });
        return;
      }

      sendJson(res, 200, { data: updated });
    } catch (error) {
      const mapped = mapApplicationError(error);
      sendJson(res, mapped.statusCode, { error: mapped.message });
    }
  }
}
