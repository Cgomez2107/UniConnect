import type { IncomingMessage, ServerResponse } from "node:http";
import type { SearchStudentsBySubject } from "../../../application/use-cases/SearchStudentsBySubject.js";
import type { GetStudentPublicProfile } from "../../../application/use-cases/GetStudentPublicProfile.js";
import type { GetPrograms } from "../../../application/use-cases/GetPrograms.js";
import type { GetSubjectsByProgram } from "../../../application/use-cases/GetSubjectsByProgram.js";

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

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

    if (!subjectId) {
      sendJson(res, 400, { error: "subjectId query parameter is required" });
      return;
    }

    try {
      const result = await this.searchStudentsUC.execute({
        subjectId,
        search: search ?? undefined,
      });

      sendJson(res, 200, { data: result, meta: { total: result.length } });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async getStudentProfile(
    _req: IncomingMessage,
    res: ServerResponse,
    studentId: string,
  ): Promise<void> {
    try {
      const result = await this.getPublicProfile.execute(studentId);

      if (!result) {
        sendJson(res, 404, { error: "Student not found" });
        return;
      }

      sendJson(res, 200, { data: result });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async getPrograms(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const facultyId = requestUrl.searchParams.get("facultyId");

    try {
      const result = await this.getProgramsUC.execute(facultyId ?? undefined);
      sendJson(res, 200, { data: result, meta: { total: result.length } });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }

  async getSubjectsByProgram(
    _req: IncomingMessage,
    res: ServerResponse,
    programId: string,
  ): Promise<void> {
    try {
      const result = await this.getSubjectsByProgramUC.execute(programId);
      sendJson(res, 200, { data: result, meta: { total: result.length } });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
  }
}
