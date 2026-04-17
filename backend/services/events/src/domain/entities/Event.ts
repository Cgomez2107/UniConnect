/**
 * Entidad: Evento académico o cultural
 * Refleja el schema real de Supabase:
 *   id, title, description, event_date, location, category, image_url, created_by
 *
 * Los campos status / maxCapacity / registeredCount / endAt se mantienen
 * opcionales por compatibilidad con code existente, pero no existen en DB.
 */
export type EventCategory = "academico" | "cultural" | "deportivo" | "otro";

export interface Event {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string;       // Mapeado desde event_date (ISO 8601)
  readonly endAt: string;         // Igual a startAt (la tabla no tiene end_at)
  readonly organizerId: string;   // Mapeado desde created_by
  readonly organizerName?: string;
  readonly category: EventCategory;
  readonly imageUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  // Campos opcionales mantenidos por compatibilidad (no existen en DB)
  readonly status?: string;
  readonly maxCapacity?: number | null;
  readonly registeredCount?: number;
}

/** @deprecated Usar EventCategory en su lugar */
export type EventStatus = string;
