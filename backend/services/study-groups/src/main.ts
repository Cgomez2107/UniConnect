import { createServer } from "node:http";

import { ApplyToStudyRequest } from "./application/use-cases/ApplyToStudyRequest.js";
import { AcceptAdminTransfer } from "./application/use-cases/AcceptAdminTransfer.js";
import { CancelStudyRequest } from "./application/use-cases/CancelStudyRequest.js";
import { CreateStudyRequest } from "./application/use-cases/CreateStudyRequest.js";
import { GetStudyRequestById } from "./application/use-cases/GetStudyRequestById.js";
import { ListApplicationsByRequest } from "./application/use-cases/ListApplicationsByRequest.js";
import { ListStudyGroupMessages } from "./application/use-cases/ListStudyGroupMessages.js";
import { ListUserNotifications } from "./application/use-cases/ListUserNotifications.js";
import { ListMembersByRequest } from "./application/use-cases/ListMembersByRequest.js";
import { ListOpenStudyRequests } from "./application/use-cases/ListOpenStudyRequests.js";
import { ListMyStudyRequests } from "./application/use-cases/ListMyStudyRequests.js";
import { ListMyApplications } from "./application/use-cases/ListMyApplications.js";
import { LeaveAdminRole } from "./application/use-cases/LeaveAdminRole.js";
import { RequestAdminTransfer } from "./application/use-cases/RequestAdminTransfer.js";
import { ReviewApplication } from "./application/use-cases/ReviewApplication.js";
import { CreateStudyGroupMessage } from "./application/use-cases/CreateStudyGroupMessage.js";
import { loadStudyGroupsEnv } from "./config/env.js";
import { NotificationObserver, StudyGroupSubject } from "./domain/events/index.js";
import type { IAdminTransferRepository } from "./domain/repositories/IAdminTransferRepository.js";
import type { IApplicationRepository } from "./domain/repositories/IApplicationRepository.js";
import type { INotificationRepository } from "./domain/repositories/INotificationRepository.js";
import type { IMemberRepository } from "./domain/repositories/IMemberRepository.js";
import type { IStudyGroupMessageRepository } from "./domain/repositories/IStudyGroupMessageRepository.js";
import type { IStudyGroupRepository } from "./domain/repositories/IStudyGroupRepository.js";
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
import { PostgresPreferenceRepository } from "./infrastructure/database/PostgresPreferenceRepository.js";
import { StudyGroupsController } from "./interfaces/http/controllers/StudyGroupsController.js";
import { handleStudyGroupsRoutes } from "./interfaces/http/routes/studyGroupsRoutes.js";
import type { IStudyRequestRepository } from "./domain/repositories/IStudyRequestRepository.js";
import { Database } from "./infrastructure/database/Database.js";
import type { Pool } from "pg";

import { NotificationService } from "../../../shared/patterns/strategy/NotificationService.js";
import { InAppWebSocketStrategy } from "../../../shared/patterns/strategy/InAppWebSocketStrategy.js";
import { EmailInstitucionalStrategy } from "../../../shared/patterns/strategy/EmailInstitucionalStrategy.js";
import { PushMovilStrategy } from "../../../shared/patterns/strategy/PushMovilStrategy.js";
import { SendGridEmailGateway } from "./infrastructure/gateways/SendGridEmailGateway.js";
import { SupabasePushGateway } from "./infrastructure/gateways/SupabasePushGateway.js";
import { SupabaseRealtimeGateway } from "./infrastructure/realtime/SupabaseRealtimeGateway.js";
import { PreferenceService } from "./application/services/PreferenceService.js";
import { NotificationMapper } from "./application/services/NotificationMapper.js";
import { PostgresUserRepository } from "./infrastructure/database/PostgresUserRepository.js";

import {
  ChatSubject as GroupChatSubject,
  RealtimeObserver as GroupRealtimeObserver,
  IdempotencyObserver as GroupIdempotencyObserver,
  type IRealtimeService as IGroupRealtimeService,
  type IIdempotencyStore as IGroupIdempotencyStore,
} from "../../messaging/src/domain/events/index.js";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

interface Repositories {
  studyRequest: IStudyRequestRepository;
  studyGroup: IStudyGroupRepository;
}

const ALL_CHANNEL_NAMES: readonly string[] = [
  "in_app_websocket",
  "email_institucional",
  "push_movil",
];

function createRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
  pool: Pool | null,
): Repositories {
  if (pool) {
    const repo = new PostgresStudyRequestRepository(pool);
    return { studyRequest: repo, studyGroup: repo };
  }

  console.log(
    JSON.stringify({
      service: "study-groups",
      level: "warn",
      message: "Database config missing or placeholder detected; using in-memory repository",
    }),
  );

  const inMemoryRepo = new InMemoryStudyRequestRepository();
  return { studyRequest: inMemoryRepo, studyGroup: inMemoryRepo as unknown as IStudyGroupRepository };
}

function createApplicationRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
  pool: Pool | null,
): IApplicationRepository {
  if (pool) {
    return new PostgresApplicationRepository(pool);
  }
  return new InMemoryApplicationRepository();
}

function createMemberRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
  pool: Pool | null,
): IMemberRepository {
  if (pool) {
    return new PostgresMemberRepository(pool);
  }
  return new InMemoryMemberRepository();
}

function createAdminTransferRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
  pool: Pool | null,
): IAdminTransferRepository {
  if (pool) {
    return new PostgresAdminTransferRepository(pool);
  }
  return new InMemoryAdminTransferRepository();
}

function createStudyGroupMessageRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
  pool: Pool | null,
): IStudyGroupMessageRepository {
  if (pool) {
    return new PostgresStudyGroupMessageRepository(pool);
  }
  return new InMemoryStudyGroupMessageRepository();
}

function createNotificationRepository(
  env: ReturnType<typeof loadStudyGroupsEnv>,
  pool: Pool | null,
): INotificationRepository {
  if (pool) {
    return new PostgresNotificationRepository(pool);
  }
  return new InMemoryNotificationRepository();
}

function bootstrap(): void {
  const env = loadStudyGroupsEnv();

  const hasDatabaseConfig =
    !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;
  const pool = hasDatabaseConfig ? Database.getInstance(env).getPool() : null;

  const { studyRequest: repository, studyGroup: studyGroupRepository } = createRepository(env, pool);
  const applicationRepository = createApplicationRepository(env, pool);
  const memberRepository = createMemberRepository(env, pool);
  const adminTransferRepository = createAdminTransferRepository(env, pool);
  const messageRepository = createStudyGroupMessageRepository(env, pool);
  const notificationRepository = createNotificationRepository(env, pool);
  const preferenceRepository = pool
    ? new PostgresPreferenceRepository(pool)
    : null;

  const preferenceService = new PreferenceService(
    preferenceRepository ?? {
      async getCanalesActivos(_userId: string, _eventType: string): Promise<string[] | null> {
        return null;
      },
      async setCanalActivo(_userId: string, _eventType: string, _canal: string, _activo: boolean): Promise<void> {},
    },
  );

  const realtimeGateway = (env.supabaseUrl && env.supabaseServiceRoleKey)
    ? new SupabaseRealtimeGateway(env.supabaseUrl, env.supabaseServiceRoleKey)
    : null;

  const emailGateway = (env.sendgridApiKey && env.emailFrom)
    ? new SendGridEmailGateway(env.sendgridApiKey, env.emailFrom, env.emailFromName ?? "UniConnect")
    : null;

  const supabaseUrl = env.supabaseUrl ?? "https://becitrklvpadvjwdbmck.supabase.co";
  const pushGateway = env.supabaseServiceRoleKey
    ? new SupabasePushGateway(`${supabaseUrl}/functions/v1/notifications`, env.supabaseServiceRoleKey)
    : null;

  const userRepository = pool
    ? new PostgresUserRepository(pool)
    : null;

  const strategies = [
    realtimeGateway
      ? new InAppWebSocketStrategy(realtimeGateway)
      : null,
    emailGateway && userRepository
      ? new EmailInstitucionalStrategy(emailGateway, userRepository)
      : null,
    pushGateway && userRepository
      ? new PushMovilStrategy(pushGateway, userRepository)
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  const notificationService = new NotificationService(strategies, preferenceService);
  const mapper = new NotificationMapper();
  const notificationObserver = new NotificationObserver(notificationRepository, notificationService, mapper);

  const subject = new StudyGroupSubject();
  subject.subscribe(notificationObserver);

  const groupChatSubject = new GroupChatSubject("study-groups-chat");
  const mockRealtimeService: IGroupRealtimeService = {
    async broadcast(channel, message) {
      console.log(
        JSON.stringify({
          service: "study-groups",
          level: "info",
          message: "WebSocket broadcast",
          channel,
          eventType: message.type,
        }),
      );
    },
  };
  const realtimeObserver = new GroupRealtimeObserver(mockRealtimeService);
  const mockIdempotencyStore: IGroupIdempotencyStore = {
    async markProcessed(_messageId) {
      return true;
    },
    async cleanup(_olderThanSeconds) {
      return;
    },
  };
  const idempotencyObserver = new GroupIdempotencyObserver(mockIdempotencyStore);
  const listOpenStudyRequests = new ListOpenStudyRequests(repository);
  const getStudyRequestById = new GetStudyRequestById(repository);
  const createStudyRequest = new CreateStudyRequest(repository);
  const listMembersByRequest = new ListMembersByRequest(memberRepository);
  const listApplicationsByRequest = new ListApplicationsByRequest(applicationRepository);
  const listStudyGroupMessages = new ListStudyGroupMessages(messageRepository);
  const createStudyGroupMessage = new CreateStudyGroupMessage(
    messageRepository,
    groupChatSubject,
    realtimeObserver,
    idempotencyObserver,
  );
  const listUserNotifications = new ListUserNotifications(notificationRepository);
  const applyToStudyRequest = new ApplyToStudyRequest(
    applicationRepository,
    repository,
    studyGroupRepository,
    subject,
  );
  const reviewApplication = new ReviewApplication(
    applicationRepository,
    studyGroupRepository,
    memberRepository,
    subject,
  );
  const requestAdminTransfer = new RequestAdminTransfer(
    adminTransferRepository,
    studyGroupRepository,
    subject,
  );
  const acceptAdminTransfer = new AcceptAdminTransfer(adminTransferRepository, studyGroupRepository, subject);
  const leaveAdminRole = new LeaveAdminRole(adminTransferRepository);
  const cancelStudyRequestUC = new CancelStudyRequest(repository);
  const listMyStudyRequestsUC = new ListMyStudyRequests(repository);
  const listMyApplicationsUC = new ListMyApplications(applicationRepository);
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
    listMyStudyRequestsUC,
    listMyApplicationsUC,
    cancelStudyRequestUC,
  );

  const server = createServer((req, res) => {
    const resp = res as any;
    // Manejo de CORS - Permitir solo orígenes específicos con credenciales
    const origin = req.headers.origin;
    const allowedOrigins = [
      "http://localhost:8081",
      "http://localhost:8082",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:8082",
      "http://192.168.140.38:8081",
      "http://192.168.140.38:8082",
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning, bypass-tunnel-reminder");
    resp.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    void (async () => {
      const handled = await handleStudyGroupsRoutes(req, res, controller);
      if (!handled) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(sendJsonError(404, "Route not found"));
      }
    })().catch((error: any) => {
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
        strategies: strategies.map(s => s.canal),
      }),
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio study-groups...`);

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
    });

    try {
      subject.clear();
      groupChatSubject.clear();

      if (realtimeGateway) {
        realtimeGateway.dispose();
      }

      if (hasDatabaseConfig) {
        await Database.getInstance().close();
      }

      console.log("[Shutdown] Limpieza de recursos completada con exito.");
      process.exit(0);
    } catch (error) {
      console.error("[Shutdown] Error durante el cierre de recursos:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap();
