/**
 * StudyGroupEvents.ts
 *
 * Define el contrato tipado de TODOS los eventos que puede emitir el dominio de Study Groups.
 *
 * Ventajas:
 * -  Compile-time safety: TypeScript valida estructura de eventos
 * -  Versionado: Fácil agregar nuevos eventos sin romper código existente
 * -  Documentado: Claro qué datos lleva cada evento
 */

/**
 * Evento: Nuevo estudiante se unió al grupo
 */
export interface StudentJoinedEvent {
  readonly type: "StudentJoined";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly groupId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly totalMembers: number;
}

/**
 * Evento: Estudiante abandonó el grupo
 */
export interface StudentLeftEvent {
  readonly type: "StudentLeft";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly groupId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly totalMembers: number;
}

/**
 * Evento: Nuevo grupo de estudio creado
 */
export interface GroupCreatedEvent {
  readonly type: "GroupCreated";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly groupId: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly title: string;
  readonly subject: string;
  readonly maxMembers: number;
}

/**
 * Evento: Grupo cerrado/desactivado
 */
export interface GroupClosedEvent {
  readonly type: "GroupClosed";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly groupId: string;
  readonly reason: "reached_max_members" | "manual_closure" | "expired";
}

/**
 * Evento: Solicitud de incorporación aceptada
 */
export interface ApplicationApprovedEvent {
  readonly type: "ApplicationApproved";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly applicationId: string;
  readonly groupId: string;
  readonly applicantId: string;
  readonly approvedBy: string;
}

/**
 * Evento: Solicitud de incorporación rechazada
 */
export interface ApplicationRejectedEvent {
  readonly type: "ApplicationRejected";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly applicationId: string;
  readonly groupId: string;
  readonly applicantId: string;
  readonly rejectedBy: string;
}

/**
 * Type Union: Representa TODOS los eventos posibles del dominio
 *
 * Ventaja: Si intentas pasar un evento inválido, TypeScript marca error 
 */
export type StudyGroupEvent =
  | StudentJoinedEvent
  | StudentLeftEvent
  | GroupCreatedEvent
  | GroupClosedEvent
  | ApplicationApprovedEvent
  | ApplicationRejectedEvent;

/**
 * Extrae el tipo específico de un evento
 * Útil para patrones discriminados por tipo
 */
export type EventType = StudyGroupEvent["type"];
