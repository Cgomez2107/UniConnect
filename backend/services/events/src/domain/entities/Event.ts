/**
 * Entidad: Evento académico o cultural
 * Puede ser creado solo por admins
 */
export type EventStatus = "abierto" | "cerrado" | "cancelado";

export interface Event {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string; // ISO 8601
  readonly endAt: string; // ISO 8601
  readonly organizerId: string;
  readonly organizerName?: string;
  readonly status: EventStatus;
  readonly maxCapacity: number | null;
  readonly registeredCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
