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
 * Evento: Solicitud de ingreso creada
 */
export interface JoinRequestEvent {
  readonly type: "JOIN_REQUEST";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly requestId: string;
  readonly applicantId: string;
  readonly recipientUserId: string;
  readonly message: string;
  readonly groupName: string;
  readonly applicantName: string;
}

/**
 * Evento: Solicitud de ingreso aceptada
 */
export interface MemberAcceptedEvent {
  readonly type: "MEMBER_ACCEPTED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly applicationId: string;
  readonly requestId: string;
  readonly applicantId: string;
  readonly applicantName: string;
  readonly approvedBy: string;
  readonly groupName: string;
}

/**
 * Evento: Solicitud de ingreso rechazada
 */
export interface MemberRejectedEvent {
  readonly type: "MEMBER_REJECTED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly applicationId: string;
  readonly requestId: string;
  readonly applicantId: string;
  readonly rejectedBy: string;
}

/**
 * Evento: Transferencia de admin solicitada
 */
export interface AdminTransferRequestedEvent {
  readonly type: "ADMIN_TRANSFER_REQUESTED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly transferId: string;
  readonly groupId: string;
  readonly oldAdminId: string;
  readonly newAdminId: string;
  readonly newState: "PendienteTransferencia";
  readonly groupName: string;
}

/**
 * Evento: Transferencia de admin aceptada
 */
export interface AdminTransferAcceptedEvent {
  readonly type: "ADMIN_TRANSFER_ACCEPTED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly transferId: string;
  readonly groupId: string;
  readonly oldAdminId: string;
  readonly newAdminId: string;
  readonly newState: "TransferenciaAceptada";
  readonly acceptedBy: string;
}

/**
 * Evento: Transferencia de admin rechazada
 */
export interface AdminTransferRejectedEvent {
  readonly type: "ADMIN_TRANSFER_REJECTED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly transferId: string;
  readonly groupId: string;
  readonly oldAdminId: string;
  readonly newAdminId: string;
  readonly newState: "Activo";
  readonly groupName: string;
}

/**
 * Evento: Transferencia de admin transferida (commit final)
 */
export interface AdminTransferCompletedEvent {
  readonly type: "ADMIN_TRANSFER_COMPLETED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly transferId: string;
  readonly groupId: string;
  readonly oldAdminId: string;
  readonly newAdminId: string;
  readonly newState: "Activo";
  readonly groupName: string;
}

/**
 * Evento: Administrador renuncia a su cargo
 */
export interface AdminRoleLeftEvent {
  readonly type: "ADMIN_ROLE_LEFT";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly requestId: string;
  readonly userId: string;
  readonly groupName: string;
}

/**
 * Evento: Participante actualiza su disponibilidad (confirmed/declined)
 */
export interface AvailabilityUpdatedEvent {
  readonly type: "AVAILABILITY_UPDATED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly sessionId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly userName: string;
  readonly status: "confirmed" | "declined";
  readonly groupName: string;
  readonly organizerId: string;
}

/**
 * Evento: Sesión de estudio cancelada
 */
export interface SessionCancelledEvent {
  readonly type: "SESSION_CANCELLED";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly sessionId: string;
  readonly requestId: string;
  readonly title: string;
  readonly groupName: string;
  readonly attendeeIds: string[];
}

/**
 * Type Union: Representa TODOS los eventos posibles del dominio
 */
export type StudyGroupEvent =
  | JoinRequestEvent
  | MemberAcceptedEvent
  | MemberRejectedEvent
  | AdminTransferRequestedEvent
  | AdminTransferAcceptedEvent
  | AdminTransferRejectedEvent
  | AdminTransferCompletedEvent
  | AdminRoleLeftEvent
  | AvailabilityUpdatedEvent
  | SessionCancelledEvent;

/**
 * Extrae el tipo específico de un evento
 * Útil para patrones discriminados por tipo
 */
export type EventType = StudyGroupEvent["type"];
