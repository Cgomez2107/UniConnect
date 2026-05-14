import { createServer } from "node:http";
import { SearchStudentsBySubject } from "./application/use-cases/SearchStudentsBySubject.js";
import { GetStudentPublicProfile } from "./application/use-cases/GetStudentPublicProfile.js";
import { GetFullProfile } from "./application/use-cases/GetFullProfile.js";
import { GetAllSubjects } from "./application/use-cases/GetAllSubjects.js";
import { GetPrograms } from "./application/use-cases/GetPrograms.js";
import { GetSubjectsByProgram } from "./application/use-cases/GetSubjectsByProgram.js";
import { GetMyPrograms } from "./application/use-cases/GetMyPrograms.js";
import { CreateStudentProfile } from "./application/use-cases/CreateStudentProfile.js";
import { UpdateStudentProfile } from "./application/use-cases/UpdateStudentProfile.js";
import { loadProfilesCatalogEnv } from "./config/env.js";
import { PostgresStudentRepository } from "./infrastructure/database/PostgresStudentRepository.js";
import { PostgresFacultyCatalogRepository } from "./infrastructure/database/PostgresFacultyCatalogRepository.js";
import { PostgresIndicatorsRepository } from "./infrastructure/database/PostgresIndicatorsRepository.js";
import { Database } from "./infrastructure/database/Database.js";
import { ProfilesCatalogController } from "./interfaces/http/controllers/ProfilesCatalogController.js";
import { handleProfilesCatalogRoutes } from "./interfaces/http/routes/profilesCatalogRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function bootstrap(): void {
  const env = loadProfilesCatalogEnv();

  const pool = Database.getInstance(env).getPool();

  const studentRepository = new PostgresStudentRepository(pool);
  const catalogRepository = new PostgresFacultyCatalogRepository(pool);
  const indicatorsRepository = new PostgresIndicatorsRepository(pool);

  const searchStudents = new SearchStudentsBySubject(studentRepository);
  const getPublicProfile = new GetStudentPublicProfile(studentRepository);
  const getFullProfile = new GetFullProfile(indicatorsRepository);
  const getAllSubjectsUC = new GetAllSubjects(catalogRepository);
  const getPrograms = new GetPrograms(catalogRepository);
  const getSubjectsByProgram = new GetSubjectsByProgram(catalogRepository);
  const getMyProgramsUC = new GetMyPrograms(studentRepository);
  const createProfileUC = new CreateStudentProfile(studentRepository);
  const updateProfileUC = new UpdateStudentProfile(studentRepository);

  const controller = new ProfilesCatalogController(
    searchStudents,
    getPublicProfile,
    getFullProfile,
    getAllSubjectsUC,
    getPrograms,
    getSubjectsByProgram,
    getMyProgramsUC,
    createProfileUC,
    updateProfileUC,
    studentRepository,
  );

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleProfilesCatalogRoutes(req, res, controller);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"),
      );
    });
  });

  (server as any).listen({ port: env.port, host: "::" }, () => {
    console.log(
      JSON.stringify({
        service: "profiles-catalog",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "::",
        nodeEnv: env.nodeEnv,
      }),
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio profiles-catalog...`);

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
    });

    try {
      await Database.getInstance().close();
      console.log("[Shutdown] Limpieza de recursos completada con éxito.");
      process.exit(0);
    } catch (error) {
      console.error("[Shutdown] Error durante el cierre de recursos:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap();
