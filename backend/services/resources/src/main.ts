import { createServer } from "node:http";

import { CreateStudyResource } from "./application/use-cases/CreateStudyResource.ts";
import { DeleteStudyResource } from "./application/use-cases/DeleteStudyResource.ts";
import { GetStudyResourceById } from "./application/use-cases/GetStudyResourceById.ts";
import { ListStudyResources } from "./application/use-cases/ListStudyResources.js";
import { UpdateStudyResource } from "./application/use-cases/UpdateStudyResource.js";
import { loadResourcesEnv } from "./config/env.ts";
import type { IStudyResourceRepository } from "./domain/repositories/IStudyResourceRepository.js";
import { InMemoryStudyResourceRepository } from "./infrastructure/database/InMemoryStudyResourceRepository.js";
import { PostgresStudyResourceRepository } from "./infrastructure/database/PostgresStudyResourceRepository.js";
import { Database } from "./infrastructure/database/Database.js";
import { SupabaseStorageCleaner } from "./infrastructure/storage/SupabaseStorageCleaner.js";
import type { Pool } from "pg";
import { ResourcesController } from "./interfaces/http/controllers/ResourcesController.js";
import { handleResourcesRoutes } from "./interfaces/http/routes/resourcesRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message, statusCode });
}

function createRepository(
  env: ReturnType<typeof loadResourcesEnv>,
  pool: Pool | null,
): IStudyResourceRepository {
  if (pool) {
    return new PostgresStudyResourceRepository(pool);
  }

  console.log(
    JSON.stringify({
      service: "resources",
      level: "warn",
      message: "Database config missing or placeholder detected; using in-memory repository",
    }),
  );

  return new InMemoryStudyResourceRepository();
}

function validateResourcesEnv(): void {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_ACCESS_SECRET } = process.env;

  const missing: string[] = [];
  if (!SUPABASE_URL?.trim()) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!JWT_ACCESS_SECRET?.trim()) missing.push("JWT_ACCESS_SECRET");

  if (missing.length > 0) {
    console.error(
      JSON.stringify({
        service: "resources",
        level: "fatal",
        message:
          "Variables de entorno faltantes requeridas para el servicio de almacenamiento: " +
          missing.join(", ") +
          ". Revisa backend/services/resources/.env o la configuración compartida.",
        missing,
      }),
    );
    process.exit(1);
  }

  const url = SUPABASE_URL!.trim();
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Protocolo inválido");
    }
  } catch {
    console.error(
      JSON.stringify({
        service: "resources",
        level: "fatal",
        message: `SUPABASE_URL no es una URL válida: "${url}". Debe ser una URL https:// de Supabase.`,
      }),
    );
    process.exit(1);
  }
}

function bootstrap(): void {
  const env = loadResourcesEnv();
  validateResourcesEnv();

  const hasDatabaseConfig =
    !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;
  const pool = hasDatabaseConfig ? Database.getInstance(env).getPool() : null;

  const repository = createRepository(env, pool);
  const listStudyResources = new ListStudyResources(repository);
  const getStudyResourceById = new GetStudyResourceById(repository);
  const createStudyResource = new CreateStudyResource(repository);
  const updateStudyResource = new UpdateStudyResource(repository);
  const storageCleaner = new SupabaseStorageCleaner(env);
  const deleteStudyResource = new DeleteStudyResource(repository, storageCleaner);

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

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio resources...`);

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
    });

    try {
      if (hasDatabaseConfig) {
        await Database.getInstance().close();
      }

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
