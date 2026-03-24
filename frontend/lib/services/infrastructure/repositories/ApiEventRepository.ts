import { SupabaseEventRepository } from "./SupabaseEventRepository";
import { fetchApi } from "@/lib/api/httpClient";
import type { IEventRepository } from "../../domain/repositories/IEventRepository";
import type { CampusEvent } from "@/types";

/**
 * Repositorio de eventos que delega al microservicio events vía gateway.
 * Aplica el patrón Adapter: traduce camelCase (API) → snake_case (dominio frontend)
 *
 * Fallback a Supabase para operaciones aún no migradas.
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
    _userId: string,
    payload: {
      title: string;
      description: string;
      location: string;
      startAt: string;
      endAt: string;
      maxCapacity?: number;
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
    },
  ): Promise<void> {
    await fetchApi(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        location: payload.location,
        startAt: payload.startAt,
        endAt: payload.endAt,
        maxCapacity: payload.maxCapacity,
      }),
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
 * Mapea respuesta del microservicio (camelCase) al tipo CampusEvent
 * que espera el frontend (snake_case)
 */
function mapEventFromApi(raw: any): CampusEvent {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    location: raw.location,
    event_date: raw.startAt ?? raw.start_at,
    category: raw.category ?? "academico",
    image_url: raw.imageUrl ?? raw.image_url ?? null,
    created_by: raw.organizerId ?? raw.organizer_id,
    created_at: raw.createdAt ?? raw.created_at,
    updated_at: raw.updatedAt ?? raw.updated_at,
    creator: raw.organizerName
      ? {
          full_name: raw.organizerName ?? raw.organizer_name,
        }
      : undefined,
    // Conservar campos adicionales para la UI aunque no estén estrictamente en CampusEvent
    ...({
      end_at: raw.endAt ?? raw.end_at,
      status: raw.status,
      max_capacity: raw.maxCapacity ?? raw.max_capacity,
      registered_count: raw.registeredCount ?? raw.registered_count ?? 0,
    } as any),
  } as CampusEvent;
}
