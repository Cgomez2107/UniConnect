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
export interface NuevoMensajeEvent {
  readonly type: "NUEVO_MENSAJE";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly messageId: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly content: string;
  readonly conversationType: "group" | "dm"; // ← Para saber qué canal usar
  readonly payload: Record<string, unknown>; // ← DTO decorado (file, mentions, reactions)
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
 * Evento: Reacción actualizada en un mensaje
 */
export interface ReactionUpdatedEvent {
  readonly type: "ReactionUpdated";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly messageId: string;
  readonly conversationId: string;
  readonly reactions: Array<{ emoji: string; userId: string }>;
}

/**
 * Evento: Voto en encuesta (legacy)
 */
export interface PollVoteEvent {
  readonly type: "PollVote";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly messageId: string;
  readonly conversationId: string;
  readonly optionIndex: number;
  readonly userId: string;
  readonly poll: {
    readonly question: string;
    readonly options: Array<{
      readonly text: string;
      readonly votes: readonly string[];
    }>;
    readonly isOpen: boolean;
    readonly closesAt: string | null;
    readonly createdAt: string;
  };
}

/**
 * Evento: Voto registrado en una encuesta
 */
export interface PollVoteRegisteredEvent {
  readonly type: "POLL_VOTE_REGISTERED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly pollId: string;
  readonly groupId: string;
  readonly userId: string;
  readonly selectedOption: number;
  readonly results: Array<{ option: string; count: number; percentage: number }>;
  readonly totalVotes: number;
}

/**
 * Evento: Encuesta cerrada por temporizador (legacy)
 */
export interface PollClosedEvent {
  readonly type: "PollClosed";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly messageId: string;
  readonly conversationId: string;
}

/**
 * Evento: Encuesta cerrada automáticamente por scheduler
 */
export interface PollClosedStatusEvent {
  readonly type: "POLL_CLOSED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly pollId: string;
  readonly groupId: string;
  readonly status: "closed";
  readonly finalResults: Array<{ option: string; count: number; percentage: number }>;
  readonly totalVotes: number;
}

/**
 * Type Union: Todos los eventos de chat
 */
export type ChatEvent =
  | NuevoMensajeEvent
  | MessageReadEvent
  | UserTypingEvent
  | ReactionUpdatedEvent
  | PollVoteEvent
  | PollVoteRegisteredEvent
  | PollVoteEvent
  | PollVoteRegisteredEvent
  | PollClosedEvent
  | PollClosedStatusEvent;

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

/**
 * Alias para compatibilidad con criterios de aceptacion
 */
export function createDMChannel(userId1: string, userId2: string): ChatChannel {
  return createDmChannel(userId1, userId2);
}
