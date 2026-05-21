import type { IncomingMessage, ServerResponse } from "node:http";

import { CreateStudyResource } from "../../../application/use-cases/CreateStudyResource.js";
import { DeleteStudyResource } from "../../../application/use-cases/DeleteStudyResource.js";
import { GetStudyResourceById } from "../../../application/use-cases/GetStudyResourceById.js";
import { ListStudyResources } from "../../../application/use-cases/ListStudyResources.js";
import { UpdateStudyResource } from "../../../application/use-cases/UpdateStudyResource.js";
import type { StudyResource } from "../../../domain/entities/StudyResource.js";
import type { CreateResourceDto } from "../dto/CreateResourceDto.js";
import type { UpdateResourceDto } from "../dto/UpdateResourceDto.js";
import type { ResourceCardResponse } from "../dto/ResourceCardResponse.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import type { z } from "zod";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendJson, sendError } from "../../../../../../shared/http/sendJson.js";

function toCardResponse(resource: StudyResource): ResourceCardResponse {
  if (resource.resourceType === "link") {
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description ?? null,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      author: resource.profiles
        ? { fullName: resource.profiles.fullName, avatarUrl: resource.profiles.avatarUrl }
        : null,
      subject: resource.subjects
        ? { name: resource.subjects.name }
        : null,
      type: "link",
      url: resource.url ?? null,
      ogTitle: resource.ogTitle ?? null,
      ogDescription: resource.ogDescription ?? null,
      ogImage: resource.ogImage ?? null,
    };
  }

  return {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? null,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    author: resource.profiles
      ? { fullName: resource.profiles.fullName, avatarUrl: resource.profiles.avatarUrl }
      : null,
    subject: resource.subjects
      ? { name: resource.subjects.name }
      : null,
    type: "file",
    fileUrl: resource.fileUrl ?? null,
    fileName: resource.fileName ?? null,
    fileType: resource.fileType ?? null,
    fileSizeKb: resource.fileSizeKb ?? null,
  };
}

function toCardArray(resources: StudyResource[]): ResourceCardResponse[] {
  return resources.map(toCardResponse);
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

      const resourceTypeRaw = requestUrl.searchParams.get("resourceType");
      const resourceType = resourceTypeRaw === "file" || resourceTypeRaw === "link" ? resourceTypeRaw : undefined;

      const result = await this.listStudyResources.execute({
        subjectId: requestUrl.searchParams.get("subjectId") ?? undefined,
        userId: requestUrl.searchParams.get("userId") ?? undefined,
        search: requestUrl.searchParams.get("search") ?? undefined,
        resourceType,
        page,
        pageSize,
      });

      sendData(res, 200, toCardArray(result.rows), { total: result.total, page, pageSize });
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

      sendData(res, 200, toCardResponse(result));
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  private toContractResource(resource: StudyResource): Record<string, unknown> {
    const names = resource.profiles?.fullName?.split(" ") ?? [];
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description ?? undefined,
      type: resource.resourceType,
      url: resource.url ?? undefined,
      uploaderUserId: resource.userId,
      uploader: resource.profiles
        ? {
            id: resource.userId,
            email: "autor@ucaldas.edu.co",
            firstName: names[0] ?? "Autor",
            lastName: names.slice(1).join(" ") || "Desconocido",
            role: "estudiante" as const,
            isVerified: true,
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
          }
        : undefined,
      subjectId: resource.subjectId,
      subject: resource.subjects
        ? {
            id: resource.subjectId,
            name: resource.subjects.name,
            programId: "00000000-0000-0000-0000-000000000000",
            code: "GEN-000",
          }
        : undefined,
      tags: [],
      viewCount: 0,
      downloadCount: 0,
      isPublic: true,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  async create(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        sendError(res, 401, "Token de autenticación requerido.");
        return;
      }

      const body = (req as any).__validatedBody ?? await readJsonBody<CreateResourceDto>(req);

      const resourceType = body.resourceType || (body.url ? "link" : "file");

      if (resourceType !== "file" && resourceType !== "link") {
        sendError(res, 400, "resourceType debe ser 'file' o 'link'.");
        return;
      }

      const created = await this.createStudyResource.execute({
        actorUserId,
        resourceType,
        programId: body.programId ?? "",
        subjectId: body.subjectId ?? "",
        title: body.title ?? "",
        description: body.description,
        url: body.url,
        fileUrl: resourceType === "link" ? undefined : (body.fileUrl ?? ""),
        fileName: resourceType === "link" ? undefined : (body.fileName ?? ""),
        fileType: body.fileType,
        fileSizeKb: body.fileSizeKb,
      });

      sendJson(res, 201, { resource: this.toContractResource(created) });
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

      sendData(res, 200, toCardResponse(updated));
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
