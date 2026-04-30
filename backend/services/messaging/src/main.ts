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
import { ChatSubject, RealtimeObserver, IdempotencyObserver, type IRealtimeService, type IIdempotencyStore } from "./domain/events/index.js";
import { loadMessagingEnv } from "./config/env.js";
import type { IMessagingRepository } from "./domain/repositories/IMessagingRepository.js";
import { InMemoryMessagingRepository } from "./infrastructure/database/InMemoryMessagingRepository.js";
import { PostgresMessagingRepository } from "./infrastructure/database/PostgresMessagingRepository.js";
import { MessagingController } from "./interfaces/http/controllers/MessagingController.js";
import { handleMessagingRoutes } from "./interfaces/http/routes/messagingRoutes.js";

function sendJsonError(statusCode: number, message: string): string {
	return JSON.stringify({ error: message, statusCode });
}

function createRepository(env: ReturnType<typeof loadMessagingEnv>): IMessagingRepository {
	const hasDatabaseConfig =
		!!env.dbHost &&
		!!env.dbPort &&
		!!env.dbName &&
		!!env.dbUser &&
		!!env.dbPassword;

	if (hasDatabaseConfig) {
		return new PostgresMessagingRepository(env);
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
	const repository = createRepository(env);

	// ✅ Crear ChatSubject para eventos en tiempo real
	const chatSubject = new ChatSubject("messaging-domain");

	// ✅ Registrar observers
	// 1. Mock de RealtimeService (en producción usarías Socket.io, ws, etc)
	const mockRealtimeService: IRealtimeService = {
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
			// En producción: chatSubject.emit(channel, ...);
		},
	};
	const realtimeObserver = new RealtimeObserver(mockRealtimeService);
	
	// 2. Mock de IdempotencyStore (en producción usarías Redis, BD, etc)
	const mockIdempotencyStore: IIdempotencyStore = {
		async markProcessed(messageId) {
			// Aquí verificarías contra Redis o BD
			// Por ahora: siempre es nuevo
			return true;
		},
		async cleanup(olderThanSeconds) {
			// Limpieza de IDs antiguos
		},
	};
	const idempotencyObserver = new IdempotencyObserver(mockIdempotencyStore);

	// Registrar observers en canal de ejemplo
	// (En producción, se registran dinámicamente por grupo/DM)
	// chatSubject.subscribe("grupo:ejemplo", realtimeObserver);
	// chatSubject.subscribe("grupo:ejemplo", idempotencyObserver);

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
}

bootstrap();
