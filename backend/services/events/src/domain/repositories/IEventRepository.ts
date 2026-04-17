import type { Event } from "../entities/Event.js";

/**
 * Contrato: acceso a datos de eventos
 * Schema real de Supabase: event_date, created_by, category, image_url
 */
export interface IEventRepository {
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  getById(id: string): Promise<Event | null>;

  create(input: {
    title: string;
    description: string;
    location: string;
    startAt: string;       // Se guarda como event_date
    endAt?: string;        // Ignorado (tabla no tiene end_at)
    organizerId: string;   // Se guarda como created_by
    category?: string;
    imageUrl?: string;
    maxCapacity?: number;  // Ignorado (tabla no tiene max_capacity)
  }): Promise<Event>;

  update(
    id: string,
    organizerId: string,
    input: {
      title?: string;
      description?: string;
      location?: string;
      startAt?: string;
      endAt?: string;
      category?: string;
      imageUrl?: string;
      maxCapacity?: number | null;
    },
  ): Promise<Event>;

  updateStatus(id: string, organizerId: string, status: string): Promise<void>;
  delete(id: string, organizerId: string): Promise<void>;
}
