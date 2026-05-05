import { createServer } from "node:http";
import { SearchStudentsBySubject } from "./application/use-cases/SearchStudentsBySubject.js";
import { GetStudentPublicProfile } from "./application/use-cases/GetStudentPublicProfile.js";
import { GetPrograms } from "./application/use-cases/GetPrograms.js";
import { GetSubjectsByProgram } from "./application/use-cases/GetSubjectsByProgram.js";
import { loadProfilesCatalogEnv } from "./config/env.js";
import { PostgresStudentRepository } from "./infrastructure/database/PostgresStudentRepository.js";
import { PostgresFacultyCatalogRepository } from "./infrastructure/database/PostgresFacultyCatalogRepository.js";
import { Database } from "./infrastructure/database/Database.js";
import { ProfilesCatalogController } from "./interfaces/http/controllers/ProfilesCatalogController.js";
import { handleProfilesCatalogRoutes } from "./interfaces/http/routes/profilesCatalogRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function bootstrap(): void {
  const env = loadProfilesCatalogEnv();

  // Inicialización del Singleton de BD
  const pool = Database.getInstance(env).getPool();

  // Repositorios con BD real e inyección de dependencia
  const studentRepository = new PostgresStudentRepository(pool);
  const catalogRepository = new PostgresFacultyCatalogRepository(pool);

  // Use cases con dependencias inyectadas
  const searchStudents = new SearchStudentsBySubject(studentRepository);
  const getPublicProfile = new GetStudentPublicProfile(studentRepository);
  const getPrograms = new GetPrograms(catalogRepository);
  const getSubjectsByProgram = new GetSubjectsByProgram(catalogRepository);

  // Controller con use cases inyectados
  const controller = new ProfilesCatalogController(
    searchStudents,
    getPublicProfile,
    getPrograms,
    getSubjectsByProgram,
  );

  // Crear servidor HTTP
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
}

bootstrap();
