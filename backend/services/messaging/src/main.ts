import { createServer } from "node:http";

import { GetConversationById } from "./application/use-cases/GetConversationById.js";
import { GetConversations } from "./application/use-cases/GetConversations.js";
import { GetMessageById } from "./application/use-cases/GetMessageById.js";
import { GetOrCreateConversation } from "./application/use-cases/GetOrCreateConversation.js";
import { ListMessages } from "./application/use-cases/ListMessages.js";
import { GetUnreadCount } from "./application/use-cases/GetUnreadCount.js";
import { MarkMessageAsRead } from "./application/use-cases/MarkMessageAsRead.js";
import { MarkConversationAsRead } from "./application/use-cases/MarkConversationAsRead.js";
import { SendMessage } from "./application/use-cases/SendMessage.js";
import { TouchConversation } from "./application/use-cases/TouchConversation.js";
import { ChatSubject, RealtimeObserver, IdempotencyObserver, ChatNotificationObserver, type IRealtimeService, type IIdempotencyStore } from "./domain/events/index.js";
import { loadMessagingEnv } from "./config/env.js";
import type { IMessagingRepository } from "./domain/repositories/IMessagingRepository.js";
import { InMemoryMessagingRepository } from "./infrastructure/database/InMemoryMessagingRepository.js";
import { PostgresMessagingRepository } from "./infrastructure/database/PostgresMessagingRepository.js";
import { Database } from "./infrastructure/database/Database.js";
import type { Pool } from "pg";
import { MessagingController } from "./interfaces/http/controllers/MessagingController.js";
import { handleMessagingRoutes } from "./interfaces/http/routes/messagingRoutes.js";
import { NotificationService } from "../../../shared/patterns/strategy/NotificationService.js";
import { InAppWebSocketStrategy } from "../../../shared/patterns/strategy/InAppWebSocketStrategy.js";
import type { IPreferenceService } from "../../../shared/patterns/strategy/IPreferenceService.js";
import type { IUserRepository, ContactInfo } from "../../../shared/patterns/strategy/IUserRepository.js";
import { SupabaseRealtimeGateway } from "./infrastructure/realtime/SupabaseRealtimeGateway.js";

function sendJsonError(statusCode: number, message: string): string {
	return JSON.stringify({ error: message, statusCode });
}

function createRepository(
  env: ReturnType<typeof loadMessagingEnv>,
  pool: Pool | null,
): IMessagingRepository {
  if (pool) {
    return new PostgresMessagingRepository(pool);
  }

	console.log(
		JSON.stringify({
			service: "messaging",
			level: "warn",
			message: "Database config missing or placeholder detected; using in-memory repository",
		}),
	);

	return new InMemoryMessagingRepository();
}

function bootstrap(): void {
  const env = loadMessagingEnv();

  const hasDatabaseConfig =
    !!env.dbHost && !!env.dbPort && !!env.dbName && !!env.dbUser && !!env.dbPassword;
  const pool = hasDatabaseConfig ? Database.getInstance(env).getPool() : null;

  const repository = createRepository(env, pool);

	// ✅ Crear ChatSubject para eventos en tiempo real
	const chatSubject = new ChatSubject("messaging-domain");

	// ✅ Registrar observers de chat (tiempo real)
	const realtimeObserver = new RealtimeObserver({
		async broadcast(channel, message) {
			console.log(
				JSON.stringify({
					service: "messaging",
					level: "info",
					message: "WebSocket broadcast",
					channel,
					eventType: message.type,
				}),
			);
		},
	});

	// ✅ Idempotency store (evita duplicados)
	const idempotencyObserver = new IdempotencyObserver({
		async markProcessed(_messageId) { return true; },
		async cleanup(_olderThanSeconds) {},
	});

	// ✅ Gateway de notificaciones vía Supabase Realtime
	const realtimeGateway = (env.supabaseUrl && env.supabaseServiceRoleKey)
		? new SupabaseRealtimeGateway(env.supabaseUrl, env.supabaseServiceRoleKey)
		: null;

	if (!realtimeGateway) {
		console.warn(
			JSON.stringify({
				service: "messaging",
				level: "warn",
				message: "Supabase credentials missing; push notifications will not be sent",
			}),
		);
	}

	// ✅ IUserRepository — resuelve contacto del destinatario antes de emitir
	const userRepository: IUserRepository = {
		async getContactInfo(userId: string): Promise<ContactInfo> {
			if (!pool) return {};
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

	// ✅ Estrategias de notificación
	const strategies = realtimeGateway
		? [new InAppWebSocketStrategy(realtimeGateway)]
		: [];

	const MESSAGING_CHANNELS = ["in_app_websocket"];
	const preferenceService: IPreferenceService = {
		async getCanalesActivos(_userId: string, _eventType: string): Promise<string[]> { return [...MESSAGING_CHANNELS]; },
		async setCanalActivo(_userId: string, _eventType: string, _canal: string, _activo: boolean): Promise<void> {},
	};

	const notificationService = new NotificationService(strategies, preferenceService);

	// ✅ ChatNotificationObserver — cierra el circuito: CH01 → ChatSubject → NotificationObserver
	const chatNotificationObserver = new ChatNotificationObserver(notificationService, userRepository);

	const getConversations = new GetConversations(repository);
	const getConversationById = new GetConversationById(repository);
	const getOrCreateConversation = new GetOrCreateConversation(repository);
	const touchConversation = new TouchConversation(repository);
	const getMessageById = new GetMessageById(repository);
	const listMessages = new ListMessages(repository);
	const getUnreadCount = new GetUnreadCount(repository);
	const sendMessage = new SendMessage(
		repository,
		chatSubject,
		realtimeObserver,
		idempotencyObserver,
		chatNotificationObserver,
	);
	const markMessageAsRead = new MarkMessageAsRead(repository);
	const markConversationAsRead = new MarkConversationAsRead(repository);

	const controller = new MessagingController(
		getConversations,
		getConversationById,
		getOrCreateConversation,
		touchConversation,
		getMessageById,
		listMessages,
		getUnreadCount,
		sendMessage,
		markMessageAsRead,
		markConversationAsRead,
	);

	const server = createServer((req, res) => {
		void (async () => {
			const handled = await handleMessagingRoutes(req, res, controller);
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
				service: "messaging",
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
		console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio messaging...`);

		server.close(() => {
			console.log("[Shutdown] Servidor HTTP cerrado.");
		});

		try {
			chatSubject.clear();

			if (realtimeGateway) {
				realtimeGateway.dispose();
			}

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
