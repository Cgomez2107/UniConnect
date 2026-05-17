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
import { RejectAdminTransfer } from "./application/use-cases/RejectAdminTransfer.js";
import { RequestAdminTransfer } from "./application/use-cases/RequestAdminTransfer.js";
import { ReviewApplication } from "./application/use-cases/ReviewApplication.js";
import { CreateStudyGroupMessage } from "./application/use-cases/CreateStudyGroupMessage.js";
import { loadStudyGroupsEnv } from "./config/env.js";
import { NotificationObserver, PersistenceObserver, StudyGroupSubject } from "./domain/events/index.js";
import { StudyGroupMembershipService } from "./domain/services/StudyGroupMembershipService.js";
import { PostgresAdminTransferRepository } from "./infrastructure/database/PostgresAdminTransferRepository.js";
import { PostgresApplicationRepository } from "./infrastructure/database/PostgresApplicationRepository.js";
import { PostgresMemberRepository } from "./infrastructure/database/PostgresMemberRepository.js";
import { PostgresNotificationRepository } from "./infrastructure/database/PostgresNotificationRepository.js";
import { PostgresStudyGroupMessageRepository } from "./infrastructure/database/PostgresStudyGroupMessageRepository.js";
import { PostgresStudyRequestRepository } from "./infrastructure/database/PostgresStudyRequestRepository.js";
import { PostgresPreferenceRepository } from "./infrastructure/database/PostgresPreferenceRepository.js";
import { StudyGroupsController } from "./interfaces/http/controllers/StudyGroupsController.js";
import { handleStudyGroupsRoutes } from "./interfaces/http/routes/studyGroupsRoutes.js";
import { Database } from "./infrastructure/database/Database.js";

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
import type { IUserRepository as IStrategyUserRepository } from "../../../shared/patterns/strategy/IUserRepository.js";
import { GroupPermissionRepository } from "./infrastructure/database/GroupPermissionRepository.js";

import {
  ChatSubject as GroupChatSubject,
  RealtimeObserver as GroupRealtimeObserver,
  IdempotencyObserver as GroupIdempotencyObserver,
  ChatNotificationObserver as GroupChatNotificationObserver,
  type IRealtimeService as IGroupRealtimeService,
} from "../../messaging/src/domain/events/index.js";

import { PostgresIdempotencyStore } from "../../../shared/patterns/idempotency/PostgresIdempotencyStore.js";
import { SupabaseRealtimeService } from "../../../shared/patterns/realtime/SupabaseRealtimeService.js";

const DIRTY_FLAG_MESSAGE =
  "CRITICAL: Database configuration missing. " +
  "This service REQUIRES a PostgreSQL database. " +
  "Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables. " +
  "In-memory repositories are ONLY available in NODE_ENV=test.";

function sendJsonError(statusCode: number, message: string): string {
  return JSON.stringify({ error: message });
}

function bootstrap(): void {
  const env = loadStudyGroupsEnv();

  const pool = Database.getInstance(env).getPool();

  const studyRequestRepository = new PostgresStudyRequestRepository(pool);
  const applicationRepository = new PostgresApplicationRepository(pool);
  const memberRepository = new PostgresMemberRepository(pool);
  const adminTransferRepository = new PostgresAdminTransferRepository(pool);
  const messageRepository = new PostgresStudyGroupMessageRepository(pool);
  const notificationRepository = new PostgresNotificationRepository(pool);
  const preferenceRepository = new PostgresPreferenceRepository(pool);

  const preferenceService = new PreferenceService(preferenceRepository);

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

  const userRepository = new PostgresUserRepository(pool);

  const strategies = [
    realtimeGateway
      ? new InAppWebSocketStrategy(realtimeGateway)
      : null,
    emailGateway
      ? new EmailInstitucionalStrategy(emailGateway, userRepository)
      : null,
    pushGateway
      ? new PushMovilStrategy(pushGateway, userRepository)
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  const notificationService = new NotificationService(strategies, preferenceService);
  const mapper = new NotificationMapper();
  const notificationObserver = new NotificationObserver(notificationRepository, notificationService, mapper);

  const subject = new StudyGroupSubject();
  subject.subscribe(notificationObserver);

  const persistenceObserver = new PersistenceObserver(adminTransferRepository);
  subject.subscribe(persistenceObserver);

  const membershipService = new StudyGroupMembershipService(subject);

  const groupChatSubject = new GroupChatSubject("study-groups-chat");

  const groupUserRepository: IStrategyUserRepository = {
    async getContactInfo(userId: string) {
      try {
        const result = await pool.query(
          `SELECT email, push_token FROM profiles WHERE id = $1`,
          [userId],
        );
        if (result.rows.length === 0) return {};
        return {
          email: result.rows[0].email as string | undefined,
          pushToken: result.rows[0].push_token as string | undefined,
        };
      } catch {
        return {};
      }
    },
  };

  const groupChatNotificationObserver = new GroupChatNotificationObserver(
    notificationService,
    groupUserRepository,
  );

  const groupPermissionRepo = new GroupPermissionRepository(pool);

  const realtimeService: IGroupRealtimeService = realtimeGateway
    ? new SupabaseRealtimeService(env.supabaseUrl!, env.supabaseServiceRoleKey!)
    : {
        async broadcast(_channel, _message) {
          console.warn(
            JSON.stringify({
              service: "study-groups",
              level: "warn",
              message: "Supabase credentials missing; real-time broadcast not available",
            }),
          );
        },
      };
  const realtimeObserver = new GroupRealtimeObserver(realtimeService);

  const idempotencyStore = new PostgresIdempotencyStore(pool);
  const idempotencyObserver = new GroupIdempotencyObserver(idempotencyStore);

  const listOpenStudyRequests = new ListOpenStudyRequests(studyRequestRepository);
  const getStudyRequestById = new GetStudyRequestById(studyRequestRepository);
  const createStudyRequest = new CreateStudyRequest(studyRequestRepository);
  const listMembersByRequest = new ListMembersByRequest(memberRepository);
  const listApplicationsByRequest = new ListApplicationsByRequest(applicationRepository);
  const listStudyGroupMessages = new ListStudyGroupMessages(messageRepository);
  const createStudyGroupMessage = new CreateStudyGroupMessage(
    messageRepository,
    groupChatSubject,
    realtimeObserver,
    idempotencyObserver,
    groupChatNotificationObserver,
    groupPermissionRepo,
    groupPermissionRepo,
  );
  const listUserNotifications = new ListUserNotifications(notificationRepository);
  const applyToStudyRequest = new ApplyToStudyRequest(
    applicationRepository,
    studyRequestRepository,
    studyRequestRepository,
    subject,
    membershipService,
  );
  const reviewApplication = new ReviewApplication(
    applicationRepository,
    studyRequestRepository,
    memberRepository,
    subject,
    membershipService,
  );
  const requestAdminTransfer = new RequestAdminTransfer(
    adminTransferRepository,
    studyRequestRepository,
    subject,
  );
  const acceptAdminTransfer = new AcceptAdminTransfer(adminTransferRepository, studyRequestRepository, subject);
  const rejectAdminTransfer = new RejectAdminTransfer(adminTransferRepository, studyRequestRepository, subject);
  const leaveAdminRole = new LeaveAdminRole(studyRequestRepository, subject);
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
    rejectAdminTransfer,
    leaveAdminRole,
  );

  const server = createServer((req, res) => {
    const resp = res as any;
    const origin = req.headers.origin || "*";
    resp.setHeader("Access-Control-Allow-Origin", origin);
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

      await Database.getInstance().close();

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

try {
  bootstrap();
} catch (error) {
  console.error(
    JSON.stringify({
      service: "study-groups",
      level: "fatal",
      message: DIRTY_FLAG_MESSAGE,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
}
