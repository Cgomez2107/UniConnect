import { createServer } from "node:http";

import { ApplyToStudyRequest } from "./application/use-cases/ApplyToStudyRequest.js";
import { AcceptAdminTransfer } from "./application/use-cases/AcceptAdminTransfer.js";
import { CreateStudyRequest } from "./application/use-cases/CreateStudyRequest.js";
import { GetStudyRequestById } from "./application/use-cases/GetStudyRequestById.js";
import { ListApplicationsByRequest } from "./application/use-cases/ListApplicationsByRequest.js";
import { ListStudyGroupMessages } from "./application/use-cases/ListStudyGroupMessages.js";
import { ListUserNotifications } from "./application/use-cases/ListUserNotifications.js";
import { ListMembersByRequest } from "./application/use-cases/ListMembersByRequest.js";
import { ListOpenStudyRequests } from "./application/use-cases/ListOpenStudyRequests.js";
import { LeaveAdminRole } from "./application/use-cases/LeaveAdminRole.js";
import { RequestAdminTransfer } from "./application/use-cases/RequestAdminTransfer.js";
import { ReviewApplication } from "./application/use-cases/ReviewApplication.js";
import { CreateStudyGroupMessage } from "./application/use-cases/CreateStudyGroupMessage.js";
import { loadStudyGroupsEnv } from "./config/env.js";
import {
  NotificationObserver,
  StudyGroupSubject,
  WebSocketNotificationObserver,
} from "./domain/events/index.js";
import type { IAdminTransferRepository } from "./domain/repositories/IAdminTransferRepository.js";
import type { IApplicationRepository } from "./domain/repositories/IApplicationRepository.js";
import type { INotificationRepository } from "./domain/repositories/INotificationRepository.js";
import type { IMemberRepository } from "./domain/repositories/IMemberRepository.js";
import type { IStudyGroupMessageRepository } from "./domain/repositories/IStudyGroupMessageRepository.js";
import { InMemoryStudyRequestRepository } from "./infrastructure/database/InMemoryStudyRequestRepository.js";
import { InMemoryAdminTransferRepository } from "./infrastructure/database/InMemoryAdminTransferRepository.js";
import { InMemoryApplicationRepository } from "./infrastructure/database/InMemoryApplicationRepository.js";
import { InMemoryMemberRepository } from "./infrastructure/database/InMemoryMemberRepository.js";
import { InMemoryNotificationRepository } from "./infrastructure/database/InMemoryNotificationRepository.js";
import { InMemoryStudyGroupMessageRepository } from "./infrastructure/database/InMemoryStudyGroupMessageRepository.js";
import { PostgresAdminTransferRepository } from "./infrastructure/database/PostgresAdminTransferRepository.js";
import { PostgresApplicationRepository } from "./infrastructure/database/PostgresApplicationRepository.js";
import { PostgresMemberRepository } from "./infrastructure/database/PostgresMemberRepository.js";
import { PostgresNotificationRepository } from "./infrastructure/database/PostgresNotificationRepository.js";
import { PostgresStudyGroupMessageRepository } from "./infrastructure/database/PostgresStudyGroupMessageRepository.js";
import { PostgresStudyRequestRepository } from "./infrastructure/database/PostgresStudyRequestRepository.js";
import { NoopStudyGroupSocketGateway } from "./infrastructure/realtime/NoopStudyGroupSocketGateway.js";
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

function createMemberRepository(env: ReturnType<typeof loadStudyGroupsEnv>): IMemberRepository {
  const hasDatabaseConfig = !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;

  if (hasDatabaseConfig) {
    return new PostgresMemberRepository(env);
  }

  return new InMemoryMemberRepository();
}

function createAdminTransferRepository(env: ReturnType<typeof loadStudyGroupsEnv>): IAdminTransferRepository {
  const hasDatabaseConfig = !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;

  if (hasDatabaseConfig) {
    return new PostgresAdminTransferRepository(env);
  }

  return new InMemoryAdminTransferRepository();
}

function createStudyGroupMessageRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
): IStudyGroupMessageRepository {
  const hasDatabaseConfig = !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;

  if (hasDatabaseConfig) {
    return new PostgresStudyGroupMessageRepository(env);
  }

  return new InMemoryStudyGroupMessageRepository();
}

function createNotificationRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
): INotificationRepository {
  const hasDatabaseConfig = !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;

  if (hasDatabaseConfig) {
    return new PostgresNotificationRepository(env);
  }

  return new InMemoryNotificationRepository();
}

function bootstrap(): void {
  const env = loadStudyGroupsEnv();

  const repository = createRepository(env);
  const applicationRepository = createApplicationRepository(env);
  const memberRepository = createMemberRepository(env);
  const adminTransferRepository = createAdminTransferRepository(env);
  const messageRepository = createStudyGroupMessageRepository(env);
  const notificationRepository = createNotificationRepository(env);
  const subject = new StudyGroupSubject();
  const socketGateway = new NoopStudyGroupSocketGateway();
  subject.subscribe(new NotificationObserver(notificationRepository));
  subject.subscribe(new WebSocketNotificationObserver(socketGateway));
  const listOpenStudyRequests = new ListOpenStudyRequests(repository);
  const getStudyRequestById = new GetStudyRequestById(repository);
  const createStudyRequest = new CreateStudyRequest(repository);
  const listMembersByRequest = new ListMembersByRequest(memberRepository);
  const listApplicationsByRequest = new ListApplicationsByRequest(applicationRepository);
  const listStudyGroupMessages = new ListStudyGroupMessages(messageRepository);
  const createStudyGroupMessage = new CreateStudyGroupMessage(messageRepository);
  const listUserNotifications = new ListUserNotifications(notificationRepository);
  const applyToStudyRequest = new ApplyToStudyRequest(
    applicationRepository,
    repository,
    subject,
  );
  const reviewApplication = new ReviewApplication(applicationRepository, subject);
  const requestAdminTransfer = new RequestAdminTransfer(adminTransferRepository, subject);
  const acceptAdminTransfer = new AcceptAdminTransfer(adminTransferRepository, subject);
  const leaveAdminRole = new LeaveAdminRole(adminTransferRepository);
  const controller = new StudyGroupsController(
    listOpenStudyRequests,
    getStudyRequestById,
    createStudyRequest,
    listMembersByRequest,
    listApplicationsByRequest,
    listStudyGroupMessages,
    createStudyGroupMessage,
    listUserNotifications,
    applyToStudyRequest,
    reviewApplication,
    requestAdminTransfer,
    acceptAdminTransfer,
    leaveAdminRole,
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

  (server as any).listen({ port: env.port, host: "0.0.0.0" }, () => {
    console.log(
      JSON.stringify({
        service: "study-groups",
        level: "info",
        message: "Service listening",
        port: env.port,
        host: "0.0.0.0",
        nodeEnv: env.nodeEnv,
      }),
    );
  });
}

bootstrap();
