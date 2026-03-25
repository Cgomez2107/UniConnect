import { SupabaseEventRepository } from "./SupabaseEventRepository";
import { fetchApi } from "@/lib/api/httpClient";
import type { IEventRepository } from "../../domain/repositories/IEventRepository";
import type { CampusEvent } from "@/types";

/**
 * Repositorio de eventos que delega al microservicio events vía gateway.
 *
 * El backend ahora refleja el schema real de Supabase:
 *   event_date → startAt, created_by → organizerId
 *   category, imageUrl presentes
 */
export class ApiEventRepository implements IEventRepository {
  private readonly fallback = new SupabaseEventRepository();

  async getAllEvents(): Promise<CampusEvent[]> {
    const data = await fetchApi<CampusEvent[]>("/events");
    return (data ?? []).map(mapEventFromApi);
  }

  async getUpcoming(): Promise<CampusEvent[]> {
    const data = await fetchApi<CampusEvent[]>("/events?upcoming=true");
    return (data ?? []).map(mapEventFromApi);
  }

  async getById(eventId: string): Promise<CampusEvent | null> {
    try {
      const data = await fetchApi<CampusEvent>(`/events/${eventId}`);
      return data ? mapEventFromApi(data) : null;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
        return null;
      }
      throw error;
    }
  }

  async create(
    userId: string,
    payload: {
      title: string;
      description: string;
      location: string;
      startAt: string;
      endAt: string;
      maxCapacity?: number;
      category?: string;
      imageUrl?: string;
    },
  ): Promise<CampusEvent> {
    const data = await fetchApi<CampusEvent>("/events", {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        location: payload.location,
        startAt: payload.startAt,
        endAt: payload.endAt,
        category: payload.category,
        imageUrl: payload.imageUrl,
        maxCapacity: payload.maxCapacity,
      }),
    });

    return mapEventFromApi(data);
  }

  async update(
    eventId: string,
    _userId: string,
    payload: {
      title?: string;
      description?: string;
      location?: string;
      startAt?: string;
      endAt?: string;
      maxCapacity?: number | null;
      category?: string;
      imageUrl?: string;
    },
  ): Promise<void> {
    await fetchApi(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async delete(eventId: string, _userId: string): Promise<void> {
    await fetchApi(`/events/${eventId}`, {
      method: "DELETE",
    });
  }

  // Operaciones pendientes — fallback a Supabase
  async getByAuthor(userId: string): Promise<CampusEvent[]> {
    return this.fallback.getByAuthor(userId);
  }

  async updateStatus(eventId: string, status: string): Promise<void> {
    return this.fallback.updateStatus(eventId, status);
  }
}

/**
 * Mapea la respuesta del microservicio al tipo CampusEvent del frontend.
 *
 * El backend devuelve:
 *   { id, title, description, location, startAt (= event_date), endAt,
 *     organizerId (= created_by), organizerName, category, imageUrl,
 *     createdAt, updatedAt }
 */
function mapEventFromApi(raw: any): CampusEvent {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    location: raw.location ?? "",
    // event_date del schema → startAt en el backend → event_date en el frontend
    event_date: raw.startAt ?? raw.eventDate ?? raw.event_date,
    category: raw.category ?? "academico",
    image_url: raw.imageUrl ?? raw.image_url ?? null,
    created_by: raw.organizerId ?? raw.createdBy ?? raw.created_by,
    created_at: raw.createdAt ?? raw.created_at,
    updated_at: raw.updatedAt ?? raw.updated_at,
    creator: raw.organizerName
      ? { full_name: raw.organizerName }
      : undefined,
  } as CampusEvent;
}
