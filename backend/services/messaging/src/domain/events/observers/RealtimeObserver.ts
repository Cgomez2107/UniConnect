/**
 * RealtimeObserver.ts
 *
 * Observer que emite eventos a través de WebSocket para notificación en tiempo real.
 *
 * Responsabilidad:
 * - Escuchar eventos de chat
 * - Convertirlos a formato WebSocket
 * - Enviarlos a usuarios conectados en el canal
 *
 * Nota: Este es un ejemplo. En producción usarías Socket.io, ws, etc.
 */

import type { IChatObserver } from "../ChatSubject.js";
import type { ChatEvent, ChatChannel } from "../ChatEvents.js";

/**
 * Interface para servicio que maneja WebSocket
 * (Abstracta para no depender de librería específica)
 */
export interface IRealtimeService {
  /**
   * Emite mensaje a usuarios conectados en un canal
   *
   * @param channel - Canal (grupo:123 o dm:u1:u2)
   * @param message - Mensaje a enviar
   */
  broadcast(
    channel: ChatChannel,
    message: {
      type: string;
      data: Record<string, unknown>;
    },
  ): Promise<void>;
}

/**
 * Observer que emite a WebSocket
 *
 * Flujo:
 * 1. NUEVO_MENSAJE ocurre en grupo:123
 * 2. RealtimeObserver.handle() se ejecuta
 * 3. Convierte evento a JSON
 * 4. iRealtimeService.broadcast() lo envía a WebSocket
 * 5. Usuarios conectados lo reciben en tiempo real ✅
 */
export class RealtimeObserver implements IChatObserver {
  readonly name = "RealtimeObserver";

  constructor(private readonly realtimeService: IRealtimeService) {}

  async handle(event: ChatEvent, channel: ChatChannel): Promise<void> {
    switch (event.type) {
      case "NUEVO_MENSAJE":
        // Emitir nuevo mensaje a través de WebSocket
        await this.realtimeService.broadcast(channel, {
          type: "new_message",
          data: {
            messageId: event.messageId,
            conversationId: event.conversationId,
            senderId: event.senderId,
            senderName: event.senderName,
            content: event.content,
            payload: event.payload,
            timestamp: event.timestamp.toISOString(),
          },
        });
        break;

      case "MessageRead":
        // Emitir indicador de mensaje leído
        await this.realtimeService.broadcast(channel, {
          type: "message_read",
          data: {
            messageId: event.messageId,
            readBy: event.readBy,
            timestamp: event.timestamp.toISOString(),
          },
        });
        break;

      case "UserTyping":
        // Emitir indicador de escritura
        await this.realtimeService.broadcast(channel, {
          type: "user_typing",
          data: {
            userId: event.userId,
            userName: event.userName,
            timestamp: event.timestamp.toISOString(),
          },
        });
        break;

      default:
        const exhaustiveCheck: never = event;
        throw new Error(`Evento no manejado: ${exhaustiveCheck}`);
    }
  }
}
