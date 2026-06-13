import { SupabaseEventRepository } from "./SupabaseEventRepository";
import { fetchApi, fetchApiEnvelope } from "@/lib/api/httpClient";
import type { IEventRepository } from "../../domain/repositories/IEventRepository";
import type { CampusEvent, EventListFilters, EventListResponse } from "@/types";

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
    try {
      const data = await fetchApi<CampusEvent[]>("/events");
      return (data ?? []).map(mapEventFromApi);
    } catch {
      return this.fallback.getAllEvents();
    }
  }

  async getUpcoming(): Promise<CampusEvent[]> {
    try {
      const data = await fetchApi<CampusEvent[]>("/events?upcoming=true");
      return (data ?? []).map(mapEventFromApi);
    } catch {
      return this.fallback.getUpcoming();
    }
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
      eventDate: string;
      maxCapacity?: number;
      category?: string;
    },
  ): Promise<CampusEvent> {
    const body: Record<string, unknown> = {
      title: payload.title,
      eventDate: payload.eventDate,
      category: payload.category || "academico",
    };
    if (payload.description) body.description = payload.description;
    if (payload.location) body.location = payload.location;
    if (payload.maxCapacity !== undefined && payload.maxCapacity > 0) {
      body.capacity = payload.maxCapacity;
    }

    const data = await fetchApi<CampusEvent>("/events", {
      method: "POST",
      body: JSON.stringify(body),
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

  async getByAuthor(userId: string, page = 1, limit = 10): Promise<EventListResponse> {
    try {
      const envelope = await fetchApiEnvelope<any>(`/events?createdBy=${userId}&page=${page}&limit=${limit}`);
      const raw = envelope.data;
      const data: CampusEvent[] = (Array.isArray(raw) ? raw : []).map(mapEventFromApi);
      const meta = (envelope.meta as EventListResponse["meta"]) ?? { total: data.length, page, limit, totalPages: Math.ceil(data.length / limit) || 1 };
      return { data, meta };
    } catch {
      return this.fallback.getByAuthor(userId, page, limit);
    }
  }

  async updateStatus(eventId: string, status: string): Promise<void> {
    return this.fallback.updateStatus(eventId, status);
  }

  async publish(eventId: string): Promise<void> {
    await fetchApi(`/events/${eventId}/publish`, { method: "POST" });
  }

  async cancel(eventId: string): Promise<void> {
    await fetchApi(`/events/${eventId}/cancel`, { method: "POST" });
  }

  async registerForEvent(eventId: string, _userId: string): Promise<void> {
    await fetchApi(`/events/${eventId}/register`, { method: "POST" });
  }

  async unregisterFromEvent(eventId: string, _userId: string): Promise<void> {
    await fetchApi(`/events/${eventId}/unregister`, { method: "POST" });
  }

  async getEventPass(eventId: string): Promise<{ qrContent: string }> {
    return fetchApi<{ qrContent: string }>(`/events/${eventId}/my-pass`);
  }

  async listEvents(filters?: EventListFilters): Promise<EventListResponse> {
    const params = new URLSearchParams();
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.categories?.length) params.set("categories", filters.categories.join(","));
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.status) params.set("status", filters.status);

    const qs = params.toString();
    const endpoint = qs ? `/events?${qs}` : "/events";

    try {
      const envelope = await fetchApiEnvelope<any>(endpoint);
      const raw = envelope.data;
      const data: CampusEvent[] = (Array.isArray(raw) ? raw : []).map(mapEventFromApi);
      const meta = (envelope.meta as EventListResponse["meta"]) ?? { total: data.length, page: filters?.page ?? 1, limit: filters?.limit ?? 10, totalPages: 1 };
      return { data, meta };
    } catch (error) {
      const fallback = this.fallback;
      const all = await fallback.getAllEvents();
      const total = all.length;
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 10;
      const start = (page - 1) * limit;
      const sliced = all.slice(start, start + limit);
      return {
        data: sliced,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }
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
    category_id: raw.categoryId ?? raw.category_id,
    image_url: raw.imageUrl ?? raw.image_url ?? null,
    created_by: raw.organizerId ?? raw.createdBy ?? raw.created_by,
    created_at: raw.createdAt ?? raw.created_at,
    updated_at: raw.updatedAt ?? raw.updated_at,
    status: raw.status ?? "published",
    capacity: raw.maxCapacity ?? raw.capacity ?? null,
    registered_count: raw.registeredCount ?? raw.registered_count ?? 0,
    isRegistered: raw.isRegistered ?? false,
    isFull: raw.isFull ?? false,
    creator: raw.organizerName
      ? { full_name: raw.organizerName }
      : undefined,
  } as CampusEvent;
}
