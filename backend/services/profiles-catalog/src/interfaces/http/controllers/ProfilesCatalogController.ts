import type { IncomingMessage, ServerResponse } from "node:http";
import type { SearchStudentsBySubject } from "../../../application/use-cases/SearchStudentsBySubject.js";
import type { GetStudentPublicProfile } from "../../../application/use-cases/GetStudentPublicProfile.js";
import type { GetPrograms } from "../../../application/use-cases/GetPrograms.js";
import type { GetSubjectsByProgram } from "../../../application/use-cases/GetSubjectsByProgram.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { DtoValidationError, Validators, validateDto } from "../../../../../../shared/libs/validation/index.js";
import { sendData, sendError, sendJson } from "../../../../../../shared/http/sendJson.js";

/**
 * Controlador HTTP del dominio profiles-catalog
 * Responsabilidad: traducir HTTP ↔ use cases (Facade pattern)
 * No contiene lógica de negocio
 */
export class ProfilesCatalogController {
  constructor(
    private readonly searchStudentsUC: SearchStudentsBySubject,
    private readonly getPublicProfile: GetStudentPublicProfile,
    private readonly getProgramsUC: GetPrograms,
    private readonly getSubjectsByProgramUC: GetSubjectsByProgram,
  ) {}

  async searchStudents(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const subjectId = requestUrl.searchParams.get("subjectId");
    const search = requestUrl.searchParams.get("search");

    try {
      validateDto(
        { subjectId, search },
        {
          subjectId: [(value) => Validators.required(value, "subjectId")],
        },
      );

      const validatedSubjectId = subjectId ?? "";

      const result = await this.searchStudentsUC.execute({
        subjectId: validatedSubjectId,
        search: search ?? undefined,
      });

      sendData(res, 200, result, { total: result.length });
    } catch (error) {
      if (error instanceof DtoValidationError) {
        sendJson(res, 400, { error: error.message, fields: error.fields });
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

      sendData(res, 200, result);
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
