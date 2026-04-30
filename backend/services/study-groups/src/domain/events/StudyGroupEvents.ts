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
export interface SolicitudIngresoEvent {
  readonly type: "SOLICITUD_INGRESO";
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
export interface MiembroAceptadoEvent {
  readonly type: "MIEMBRO_ACEPTADO";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly applicationId: string;
  readonly requestId: string;
  readonly applicantId: string;
  readonly approvedBy: string;
  readonly groupName: string;
}

/**
 * Evento: Solicitud de ingreso rechazada
 */
export interface MiembroRechazadoEvent {
  readonly type: "MIEMBRO_RECHAZADO";
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
export interface TransferenciaAdminSolicitadaEvent {
  readonly type: "TRANSFERENCIA_ADMIN_SOLICITADA";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly transferId: string;
  readonly requestId: string;
  readonly actorUserId: string;
  readonly targetUserId: string;
  readonly groupName: string;
}

/**
 * Evento: Transferencia de admin aceptada
 */
export interface TransferenciaAdminAceptadaEvent {
  readonly type: "TRANSFERENCIA_ADMIN_ACEPTADA";
  readonly version: "1.0";
  readonly timestamp: Date;
  readonly transferId: string;
  readonly requestId: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly actorUserId: string;
}

/**
 * Type Union: Representa TODOS los eventos posibles del dominio
 *
 * Ventaja: Si intentas pasar un evento inválido, TypeScript marca error 
 */
export type StudyGroupEvent =
  | SolicitudIngresoEvent
  | MiembroAceptadoEvent
  | MiembroRechazadoEvent
  | TransferenciaAdminSolicitadaEvent
  | TransferenciaAdminAceptadaEvent;

/**
 * Extrae el tipo específico de un evento
 * Útil para patrones discriminados por tipo
 */
export type EventType = StudyGroupEvent["type"];
