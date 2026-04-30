import { createServer } from "node:http";

import { ApplyToStudyRequest } from "./application/use-cases/ApplyToStudyRequest.js";
import { CreateStudyRequest } from "./application/use-cases/CreateStudyRequest.js";
import { GetStudyRequestById } from "./application/use-cases/GetStudyRequestById.js";
import { ListApplicationsByRequest } from "./application/use-cases/ListApplicationsByRequest.js";
import { ListOpenStudyRequests } from "./application/use-cases/ListOpenStudyRequests.js";
import { ReviewApplication } from "./application/use-cases/ReviewApplication.js";
import { loadStudyGroupsEnv } from "./config/env.js";
import type { IApplicationRepository } from "./domain/repositories/IApplicationRepository.js";
import { InMemoryStudyRequestRepository } from "./infrastructure/database/InMemoryStudyRequestRepository.js";
import { InMemoryApplicationRepository } from "./infrastructure/database/InMemoryApplicationRepository.js";
import { PostgresApplicationRepository } from "./infrastructure/database/PostgresApplicationRepository.js";
import { PostgresStudyRequestRepository } from "./infrastructure/database/PostgresStudyRequestRepository.js";
import { StudyGroupsController } from "./interfaces/http/controllers/StudyGroupsController.js";
import { handleStudyGroupsRoutes } from "./interfaces/http/routes/studyGroupsRoutes.js";
import type { IStudyRequestRepository } from "./domain/repositories/IStudyRequestRepository.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function createRepository(env: ReturnType<typeof loadStudyGroupsEnv>): IStudyRequestRepository {
  const hasDatabaseConfig = !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;

  if (hasDatabaseConfig) {
    return new PostgresStudyRequestRepository(env);
  }

  console.log(
    JSON.stringify({
      service: "study-groups",
      level: "warn",
      message: "Database config missing or placeholder detected; using in-memory repository",
    }),
  );

  return new InMemoryStudyRequestRepository();
}

function createApplicationRepository(env: ReturnType<typeof loadStudyGroupsEnv>): IApplicationRepository {
  const hasDatabaseConfig = !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;

  if (hasDatabaseConfig) {
    return new PostgresApplicationRepository(env);
  }

  return new InMemoryApplicationRepository();
}

function bootstrap(): void {
  const env = loadStudyGroupsEnv();

  const repository = createRepository(env);
  const applicationRepository = createApplicationRepository(env);
  const listOpenStudyRequests = new ListOpenStudyRequests(repository);
  const getStudyRequestById = new GetStudyRequestById(repository);
  const createStudyRequest = new CreateStudyRequest(repository);
  const listApplicationsByRequest = new ListApplicationsByRequest(applicationRepository);
  const applyToStudyRequest = new ApplyToStudyRequest(applicationRepository);
  const reviewApplication = new ReviewApplication(applicationRepository);
  const controller = new StudyGroupsController(
    listOpenStudyRequests,
    getStudyRequestById,
    createStudyRequest,
    listApplicationsByRequest,
    applyToStudyRequest,
    reviewApplication,
  );

  const server = createServer((req, res) => {
    void (async () => {
      const handled = await handleStudyGroupsRoutes(req, res, controller);
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
        service: "study-groups",
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
