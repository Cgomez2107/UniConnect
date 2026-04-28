/**
 * ChatEvents.ts
 *
 * Contrato tipado de eventos para el dominio de Messaging (Chat).
 *
 * Diferencia con StudyGroupEvents:
 * - Estos eventos usan CANALES para enrutar a usuarios específicos
 * - Un evento de chat grupo NO va a todos, solo al grupo
 * - Un evento de DM solo va al usuario y su contacto
 */

/**
 * Evento: Nuevo mensaje en conversación
 */
export interface NewMessageEvent {
  readonly type: "NewMessage";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly messageId: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly content: string;
  readonly conversationType: "group" | "dm"; // ← Para saber qué canal usar
  readonly payload?: Record<string, unknown>; // ← Payload decorado (file, mentions, reactions)
}

/**
 * Evento: Mensaje marcado como leído
 */
export interface MessageReadEvent {
  readonly type: "MessageRead";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly messageId: string;
  readonly conversationId: string;
  readonly readBy: string;
}

/**
 * Evento: Usuario está escribiendo (typing indicator)
 */
export interface UserTypingEvent {
  readonly type: "UserTyping";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly conversationId: string;
  readonly userId: string;
  readonly userName: string;
}

/**
 * Type Union: Todos los eventos de chat
 */
export type ChatEvent =
  | NewMessageEvent
  | MessageReadEvent
  | UserTypingEvent;

/**
 * Sistema de canales para enrutamiento de eventos
 *
 * Patrón:
 * - "grupo:{groupId}" → Usuarios del grupo reciben
 * - "dm:{user1}:{user2}" → Solo esos 2 usuarios reciben (siempre ordenado)
 */
export type ChatChannel = `grupo:${string}` | `dm:${string}:${string}`;

/**
 * Función helper para crear canal de grupo
 */
export function createGroupChannel(groupId: string): ChatChannel {
  return `grupo:${groupId}`;
}

/**
 * Función helper para crear canal de DM
 * Asegura que siempre esté en el mismo orden (user1 < user2 lexicográficamente)
 */
export function createDmChannel(userId1: string, userId2: string): ChatChannel {
  const sorted = [userId1, userId2].sort();
  return `dm:${sorted[0]}:${sorted[1]}`;
}
