import type { IncomingMessage, ServerResponse } from "node:http";
import { z, ZodError } from "zod";
import type { SearchStudentsBySubject } from "../../../application/use-cases/SearchStudentsBySubject.js";
import type { GetStudentPublicProfile } from "../../../application/use-cases/GetStudentPublicProfile.js";
import type { GetFullProfile } from "../../../application/use-cases/GetFullProfile.js";
import type { GetPrograms } from "../../../application/use-cases/GetPrograms.js";
import type { GetSubjectsByProgram } from "../../../application/use-cases/GetSubjectsByProgram.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { sendData, sendError } from "../../../../../../shared/http/sendJson.js";

const SearchStudentsQuerySchema = z.object({
  subjectId: z.string().min(1, "subjectId es requerido"),
  search: z.string().optional(),
});

export class ProfilesCatalogController {
  constructor(
    private readonly searchStudentsUC: SearchStudentsBySubject,
    private readonly getPublicProfile: GetStudentPublicProfile,
    private readonly getFullProfileUC: GetFullProfile,
    private readonly getProgramsUC: GetPrograms,
    private readonly getSubjectsByProgramUC: GetSubjectsByProgram,
  ) {}

  async searchStudents(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const subjectId = requestUrl.searchParams.get("subjectId");
    const search = requestUrl.searchParams.get("search");
    const currentUserIdParam = requestUrl.searchParams.get("currentUserId");
    const currentUserIdHeader = req.headers["x-user-id"];
    const currentUserId =
      (typeof currentUserIdParam === "string" && currentUserIdParam.trim())
        ? currentUserIdParam
        : typeof currentUserIdHeader === "string"
        ? currentUserIdHeader
        : Array.isArray(currentUserIdHeader)
        ? currentUserIdHeader[0]
        : undefined;

    try {
      const parsed = SearchStudentsQuerySchema.parse({ subjectId, search });

      const result = await this.searchStudentsUC.execute({
        subjectId: parsed.subjectId,
        search: parsed.search,
        currentUserId,
      });

      sendData(res, 200, result, { total: result.length });
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, "Error de validación: el campo 'subjectId' es requerido.");
        return;
      }

      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getStudentProfile(
    req: IncomingMessage,
    res: ServerResponse,
    studentId: string,
  ): Promise<void> {
    try {
      const requestUrl = new URL(req.url ?? "/", "http://localhost");
      const vista = requestUrl.searchParams.get("vista");
      const currentUserIdParam = requestUrl.searchParams.get("currentUserId");
      const currentUserIdHeader = req.headers["x-user-id"];
      const currentUserId =
        (typeof currentUserIdParam === "string" && currentUserIdParam.trim())
          ? currentUserIdParam
          : typeof currentUserIdHeader === "string"
          ? currentUserIdHeader
          : Array.isArray(currentUserIdHeader)
          ? currentUserIdHeader[0]
          : undefined;

      const result = await this.getPublicProfile.execute(studentId, currentUserId);

      if (!result) {
        sendError(res, 404, "Student not found");
        return;
      }

      if (vista === "completa") {
        const decorado = await this.getFullProfileUC.execute(result);
        sendData(res, 200, decorado.toJSON());
      } else {
        sendData(res, 200, result);
      }
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getPrograms(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const facultyId = requestUrl.searchParams.get("facultyId");

    try {
      const result = await this.getProgramsUC.execute(facultyId ?? undefined);
      sendData(res, 200, result, { total: result.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getSubjectsByProgram(
    _req: IncomingMessage,
    res: ServerResponse,
    programId: string,
  ): Promise<void> {
    try {
      const result = await this.getSubjectsByProgramUC.execute(programId);
      sendData(res, 200, result, { total: result.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
