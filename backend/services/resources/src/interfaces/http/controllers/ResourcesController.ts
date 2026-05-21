import type { IncomingMessage, ServerResponse } from "node:http";
import { z, ZodError } from "zod";

import { CreateStudyResource } from "../../../application/use-cases/CreateStudyResource.js";
import { DeleteStudyResource } from "../../../application/use-cases/DeleteStudyResource.js";
import { GetStudyResourceById } from "../../../application/use-cases/GetStudyResourceById.js";
import { ListStudyResources } from "../../../application/use-cases/ListStudyResources.js";
import { UpdateStudyResource } from "../../../application/use-cases/UpdateStudyResource.js";
import { ParseUrlMetadata } from "../../../application/use-cases/ParseUrlMetadata.js";
import type { UpdateResourceDto } from "../dto/UpdateResourceDto.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { readJsonBody } from "../middlewares/readJsonBody.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

const CreateResourceBodySchema = z.object({
  programId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().optional(),
  fileSizeKb: z.number().positive().optional(),
  ogTitle: z.string().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
});

const ParseUrlBodySchema = z.object({
  url: z.string().url(),
});

export class ResourcesController {
  constructor(
    private readonly listStudyResources: ListStudyResources,
    private readonly getStudyResourceById: GetStudyResourceById,
    private readonly createStudyResource: CreateStudyResource,
    private readonly updateStudyResource: UpdateStudyResource,
    private readonly deleteStudyResource: DeleteStudyResource,
    private readonly parseUrlMetadata: ParseUrlMetadata,
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

      const body = await readJsonBody(req);
      const parsed = CreateResourceBodySchema.parse(body);

      const created = await this.createStudyResource.execute({
        actorUserId,
        programId: parsed.programId,
        subjectId: parsed.subjectId,
        title: parsed.title,
        description: parsed.description,
        fileUrl: parsed.fileUrl,
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        fileSizeKb: parsed.fileSizeKb,
        ogTitle: parsed.ogTitle,
        ogDescription: parsed.ogDescription,
        ogImage: parsed.ogImage,
      });

      sendData(res, 201, created);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Error de validación: todos los campos requeridos deben estar presentes.");
        return;
      }

      if (error instanceof Error && "code" in error) {
        const pgCode = (error as any).code;
        if (pgCode === "23503") {
          sendError(res, 400, "La materia o el programa seleccionado no existe.");
          return;
        }
        if (pgCode === "22001") {
          sendError(res, 400, "El nombre o tipo del archivo es demasiado largo.");
          return;
        }
      }

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

  async parseUrl(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await readJsonBody(req);
      const parsed = ParseUrlBodySchema.parse(body);

      const metadata = await this.parseUrlMetadata.execute({ url: parsed.url });

      sendData(res, 200, metadata);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "URL inválida. Debe ser una URL completa (incluye https://).");
        return;
      }

      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
