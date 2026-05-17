import { createServer } from "node:http";

import { CreateStudyResource } from "./application/use-cases/CreateStudyResource.ts";
import { DeleteStudyResource } from "./application/use-cases/DeleteStudyResource.ts";
import { GetStudyResourceById } from "./application/use-cases/GetStudyResourceById.ts";
import { ListStudyResources } from "./application/use-cases/ListStudyResources.js";
import { UpdateStudyResource } from "./application/use-cases/UpdateStudyResource.js";
import { loadResourcesEnv } from "./config/env.ts";
import { PostgresStudyResourceRepository } from "./infrastructure/database/PostgresStudyResourceRepository.js";
import { PostgresPermissionValidator } from "./infrastructure/database/PostgresPermissionValidator.js";
import { OpenGraphService } from "./infrastructure/og/OpenGraphService.js";
import { Database } from "./infrastructure/database/Database.js";
import { SupabaseStorageCleaner } from "./infrastructure/storage/SupabaseStorageCleaner.js";
import type { Pool } from "pg";
import { ResourcesController } from "./interfaces/http/controllers/ResourcesController.js";
import { handleResourcesRoutes } from "./interfaces/http/routes/resourcesRoutes.js";

const DIRTY_FLAG_MESSAGE =
  "CRITICAL: Database configuration missing. " +
  "This service REQUIRES a PostgreSQL database. " +
  "Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables. " +
  "In-memory repositories are ONLY available in NODE_ENV=test.";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message, statusCode });
}

function bootstrap(): void {
  const env = loadResourcesEnv();

  const pool: Pool = Database.getInstance(env).getPool();

  const repository = new PostgresStudyResourceRepository(pool);
  const permissionValidator = new PostgresPermissionValidator(pool);
  const openGraphService = new OpenGraphService();

  const listStudyResources = new ListStudyResources(repository);
  const getStudyResourceById = new GetStudyResourceById(repository);
  const createStudyResource = new CreateStudyResource(repository, openGraphService);
  const updateStudyResource = new UpdateStudyResource(repository, permissionValidator);
  const storageCleaner = new SupabaseStorageCleaner(env);
  const deleteStudyResource = new DeleteStudyResource(repository, permissionValidator, storageCleaner);

  const controller = new ResourcesController(
    listStudyResources,
    getStudyResourceById,
    createStudyResource,
    updateStudyResource,
    deleteStudyResource,
  );

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleResourcesRoutes(req, res, controller);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(sendJsonError(500, error instanceof Error ? error.message : "Unexpected service error"));
    });
  });

  (server as any).listen({ port: env.port, host: "::" }, () => {
    console.log(
      JSON.stringify({
        service: "resources",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "::",
        nodeEnv: env.nodeEnv,
      }),
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio resources...`);

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

try {
  bootstrap();
} catch (error) {
  console.error(
    JSON.stringify({
      service: "resources",
      level: "fatal",
      message: DIRTY_FLAG_MESSAGE,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
}
