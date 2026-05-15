import type { IncomingMessage, ServerResponse } from "node:http";
import type { SearchStudentsBySubject } from "../../../application/use-cases/SearchStudentsBySubject.js";
import type { GetStudentPublicProfile } from "../../../application/use-cases/GetStudentPublicProfile.js";
import type { GetFullProfile } from "../../../application/use-cases/GetFullProfile.js";
import type { GetAllSubjects } from "../../../application/use-cases/GetAllSubjects.js";
import type { GetPrograms } from "../../../application/use-cases/GetPrograms.js";
import type { GetSubjectsByProgram } from "../../../application/use-cases/GetSubjectsByProgram.js";
import type { GetMyPrograms } from "../../../application/use-cases/GetMyPrograms.js";
import type { CreateStudentProfile } from "../../../application/use-cases/CreateStudentProfile.js";
import type { UpdateStudentProfile } from "../../../application/use-cases/UpdateStudentProfile.js";
import type { IStudentRepository } from "../../../domain/repositories/IStudentRepository.js";
import { getActorUserId } from "../middlewares/getActorUserId.js";
import { mapErrorToHttpStatus } from "../../../../../../shared/libs/errors/mapHttpStatus.js";
import { DtoValidationError } from "../../../../../../shared/libs/validation/index.js";
import { sendData, sendError, sendJson } from "../../../../../../shared/http/sendJson.js";

export class ProfilesCatalogController {
  constructor(
    private readonly searchStudentsUC: SearchStudentsBySubject,
    private readonly getPublicProfile: GetStudentPublicProfile,
    private readonly getFullProfileUC: GetFullProfile,
    private readonly getAllSubjectsUC: GetAllSubjects,
    private readonly getProgramsUC: GetPrograms,
    private readonly getSubjectsByProgramUC: GetSubjectsByProgram,
    private readonly getMyProgramsUC: GetMyPrograms,
    private readonly createProfileUC: CreateStudentProfile,
    private readonly updateProfileUC: UpdateStudentProfile,
    private readonly studentRepository: IStudentRepository,
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
      const result = await this.searchStudentsUC.execute({
        subjectId: subjectId ?? undefined,
        search: search ?? undefined,
        currentUserId,
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

  async getAllSubjects(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const result = await this.getAllSubjectsUC.execute();
      sendData(res, 200, result, { total: result.length });
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

  async getMyProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      const student = await this.getPublicProfile.execute(userId, userId);
      if (!student) {
        sendError(res, 404, "Perfil no encontrado");
        return;
      }

      const fullProfile = await this.getFullProfileUC.execute(student);
      const meta = fullProfile.toJSON();

      sendData(res, 200, {
        id: student.id,
        full_name: student.fullName,
        avatar_url: student.avatarUrl,
        bio: student.bio,
        phone_number: student.phoneNumber,
        role: "estudiante",
        semester: student.semester,
        program_id: student.programId,
        program_name: student.programName ?? null,
        faculty_name: student.facultyName ?? null,
        is_active: true,
        created_at: student.createdAt,
        updated_at: student.updatedAt,
        carrera: meta.carrera ?? null,
        asignaturas_activas: meta.asignaturasActivas ?? [],
        indicadores: meta.indicadores ?? null,
        insignias: meta.insignias ?? [],
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async createProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { fullName } = JSON.parse(body);
          if (!fullName) {
            sendError(res, 400, "fullName es requerido");
            return;
          }

          const profile = await this.createProfileUC.execute({ id: userId, fullName });
          sendData(res, 201, profile);
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async updateProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body);

          let profile = await this.updateProfileUC.execute(userId, {
            fullName: data.full_name,
            bio: data.bio ?? null,
            phoneNumber: data.phone_number ?? null,
            avatarUrl: data.avatar_url !== undefined ? data.avatar_url : undefined,
            semester: data.semester !== undefined ? Number(data.semester) : undefined,
          });

          if (!profile) {
            profile = await this.createProfileUC.execute({
              id: userId,
              fullName: data.full_name || "Usuario",
            });
          }

          sendData(res, 200, profile);
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getMyPrograms(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      const programs = await this.getMyProgramsUC.execute(userId);
      const mapped = programs.map((p) => ({
        program_id: p.id,
        is_primary: p.isPrimary,
        programs: {
          id: p.id,
          name: p.name,
          ...(p.facultyName ? { faculties: { name: p.facultyName } } : {}),
        },
      }));
      sendData(res, 200, mapped, { total: mapped.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async getMySubjects(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      const subjects = await this.studentRepository.getSubjectsByUserId(userId);
      const mapped = subjects.map((s) => ({
        subject_id: s.subjectId,
        subjects: {
          id: s.subjectId,
          name: s.name,
        },
      }));
      sendData(res, 200, mapped, { total: mapped.length });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async setPrimaryProgram(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { program_id } = JSON.parse(body);
          if (!program_id) {
            sendError(res, 400, "program_id es requerido");
            return;
          }

          await this.studentRepository.setPrimaryProgram(userId, program_id);
          sendData(res, 200, { message: "Programa principal actualizado" });
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async addMySubject(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { subject_id } = JSON.parse(body);
          if (!subject_id) {
            sendError(res, 400, "subject_id es requerido");
            return;
          }
          await this.studentRepository.addSubject(userId, subject_id);
          sendData(res, 201, { message: "Materia agregada" });
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async removeMySubject(req: IncomingMessage, res: ServerResponse, subjectId: string): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      await this.studentRepository.removeSubject(userId, subjectId);
      sendData(res, 200, { message: "Materia eliminada" });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async uploadAvatar(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const userId = getActorUserId(req);
    if (!userId) {
      sendError(res, 401, "Autenticación requerida");
      return;
    }

    try {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { user_id, image } = JSON.parse(body);

          if (!image) {
            sendError(res, 400, "image es requerido");
            return;
          }

          if (user_id && user_id !== userId) {
            sendError(res, 403, "user_id no coincide con el usuario autenticado");
            return;
          }

          const matches = image.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
          if (!matches) {
            sendError(res, 400, "Formato de imagen inválido. Usar data URL base64 (jpeg, png, webp)");
            return;
          }

          const mimeType = matches[1];
          const extension = matches[2];
          const base64Data = matches[3];
          const buffer = Buffer.from(base64Data, "base64");

          const supabaseUrl = process.env.SUPABASE_URL ?? "https://becitrklvpadvjwdbmck.supabase.co";
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

          if (!serviceRoleKey) {
            sendError(res, 500, "Supabase service role key no configurada");
            return;
          }

          const uploadPath = `${userId}/avatar.${extension}`;
          const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${uploadPath}`;

          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": mimeType,
            },
            body: buffer,
          });

          if (!uploadResponse.ok) {
            const err = await uploadResponse.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`Error al subir avatar: ${JSON.stringify(err)}`);
          }

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${uploadPath}`;

          await this.studentRepository.update(userId, { avatarUrl: publicUrl });

          sendData(res, 200, { url: publicUrl });
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
