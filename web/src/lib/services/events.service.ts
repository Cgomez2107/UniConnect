/**
 * @deprecated Use deps.apiClients.events directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";
import type { CampusEventUI } from "@/types/ui";

export function mapEvent(e: any): CampusEventUI {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    eventDate: e.startAt ?? e.eventDate?.toISOString?.() ?? e.eventDate ?? e.event_date,
    location: e.location ?? null,
    category: e.category ?? "academico",
    imageUrl: e.imageUrl ?? e.image_url ?? null,
    createdBy: e.createdBy ?? e.created_by ?? null,
    createdAt: e.createdAt?.toISOString?.() ?? e.createdAt ?? e.created_at,
    updatedAt: e.updatedAt?.toISOString?.() ?? e.updatedAt ?? e.updated_at,
    status: e.status ?? e.state ?? "draft",
    maxCapacity: e.maxCapacity ?? e.max_capacity ?? null,
    registeredCount: e.registeredCount ?? e.registered_count ?? 0,
    creator: e.creator ? { fullName: e.creator.fullName ?? e.creator.full_name } : null,
  };
}

const eventsService = {
  async listEvents(filters?: { category?: string; page?: number; perPage?: number; createdBy?: string }) {
    const events = await deps.apiClients.events.list(filters);
    return events.map(mapEvent);
  },

  async getEventById(id: string) {
    const raw = await deps.apiClients.events.getById(id);
    const event = mapEvent(raw);
    return {
      event,
      isRegistered: (raw as any).isRegistered === true,
    };
  },

  async createEvent(data: {
    title: string;
    description?: string;
    startAt: string;
    endAt?: string;
    location?: string;
    category?: string;
    maxCapacity?: number;
  }) {
    const event = await deps.apiClients.events.create({
      title: data.title,
      description: data.description,
      eventDate: data.startAt,
      location: data.location,
      category: data.category,
      capacity: data.maxCapacity,
    });
    return mapEvent(event);
  },

  async updateEvent(id: string, data: { title?: string; description?: string; startAt?: string; location?: string; category?: string; maxCapacity?: number }) {
    const event = await deps.apiClients.events.update(id, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startAt !== undefined && { eventDate: data.startAt }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.maxCapacity !== undefined && { capacity: data.maxCapacity }),
    });
    return mapEvent(event);
  },

  async deleteEvent(id: string) {
    await deps.apiClients.events.delete(id);
  },

  async registerForEvent(eventId: string) {
    await deps.apiClients.events.register(eventId);
  },

  async publishEvent(eventId: string) {
    const event = await deps.apiClients.events.publish(eventId);
    return mapEvent(event);
  },

  async cancelEvent(eventId: string) {
    const event = await deps.apiClients.events.cancel(eventId);
    return mapEvent(event);
  },
};

export default eventsService;
