import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import {
  mapEventDtoToDomain,
  mapEventDomainToDto,
} from "../mappers/index.js";
import type {
  EventDTO,
  Event,
} from "@uniconnect/shared-types";

export interface CreateEventPayload {
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  category?: string;
  isOnline?: boolean;
  eventUrl?: string;
  capacity?: number;
  tags?: string[];
}

export interface ListEventsFilters {
  page?: number;
  perPage?: number;
  createdBy?: string;
  search?: string;
  categories?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class EventsClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async list(filters?: ListEventsFilters): Promise<Event[]> {
    const response = await this.transport.request<EventDTO[]>({
      method: "GET",
      url: "/events",
      params: {
        ...(filters?.page !== undefined && { page: filters.page }),
        ...(filters?.perPage !== undefined && { per_page: filters.perPage }),
        ...(filters?.createdBy !== undefined && { created_by: filters.createdBy }),
        ...(filters?.search !== undefined && { search: filters.search }),
        ...(filters?.categories !== undefined && { categories: filters.categories }),
        ...(filters?.status !== undefined && { status: filters.status }),
        ...(filters?.startDate !== undefined && { startDate: filters.startDate }),
        ...(filters?.endDate !== undefined && { endDate: filters.endDate }),
      },
    });
    return this.ensureArray(response.data).map((dto) => mapEventDtoToDomain(dto));
  }

  async listPaginated(filters?: ListEventsFilters): Promise<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await this.transport.request<any>({
      method: "GET",
      url: "/events",
      unwrapEnvelope: false,
      params: {
        ...(filters?.page !== undefined && { page: filters.page }),
        ...(filters?.perPage !== undefined && { limit: filters.perPage }),
        ...(filters?.createdBy !== undefined && { created_by: filters.createdBy }),
        ...(filters?.search !== undefined && { search: filters.search }),
        ...(filters?.categories !== undefined && { categories: filters.categories }),
        ...(filters?.status !== undefined && { status: filters.status }),
        ...(filters?.startDate !== undefined && { startDate: filters.startDate }),
        ...(filters?.endDate !== undefined && { endDate: filters.endDate }),
      },
    });
    const raw = response.data as any;
    const rawData = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const rawMeta = !Array.isArray(raw) ? raw?.meta : null;
    const meta = rawMeta ?? { total: rawData.length, page: filters?.page ?? 1, limit: filters?.perPage ?? 10, totalPages: 1 };
    return { data: rawData, meta };
  }

  async getById(id: string): Promise<Event> {
    const response = await this.transport.request<EventDTO>({
      method: "GET",
      url: `/events/${id}`,
    });
    return mapEventDtoToDomain(response.data);
  }

  async create(payload: CreateEventPayload): Promise<Event> {
    const response = await this.transport.request<EventDTO>({
      method: "POST",
      url: "/events",
      body: {
        title: payload.title,
        description: payload.description,
        eventDate: payload.eventDate,
        location: payload.location,
        category: payload.category,
        isOnline: payload.isOnline,
        eventUrl: payload.eventUrl,
        capacity: payload.capacity,
        tags: payload.tags,
      },
    });
    return mapEventDtoToDomain(response.data);
  }

  async update(id: string, payload: Partial<CreateEventPayload>): Promise<Event> {
    const response = await this.transport.request<EventDTO>({
      method: "PATCH",
      url: `/events/${id}`,
      body: {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.eventDate !== undefined && { eventDate: payload.eventDate }),
        ...(payload.location !== undefined && { location: payload.location }),
        ...(payload.category !== undefined && { category: payload.category }),
        ...(payload.isOnline !== undefined && { isOnline: payload.isOnline }),
        ...(payload.eventUrl !== undefined && { eventUrl: payload.eventUrl }),
        ...(payload.capacity !== undefined && { capacity: payload.capacity }),
        ...(payload.tags !== undefined && { tags: payload.tags }),
      },
    });
    return mapEventDtoToDomain(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.transport.request({
      method: "DELETE",
      url: `/events/${id}`,
    });
  }

  async register(eventId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/events/${eventId}/register`,
    });
  }

  async unregister(eventId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: `/events/${eventId}/unregister`,
    });
  }

  async publish(eventId: string): Promise<Event> {
    const response = await this.transport.request<EventDTO>({
      method: "POST",
      url: `/events/${eventId}/publish`,
    });
    return mapEventDtoToDomain(response.data);
  }

  async cancel(eventId: string): Promise<Event> {
    const response = await this.transport.request<EventDTO>({
      method: "POST",
      url: `/events/${eventId}/cancel`,
    });
    return mapEventDtoToDomain(response.data);
  }

  async getMyPass(eventId: string): Promise<{ qrContent: string }> {
    const response = await this.transport.request<{ qrContent: string }>({
      method: "GET",
      url: `/events/${eventId}/my-pass`,
    });
    return response.data;
  }

  async listMyPasses(): Promise<{ eventId: string; eventTitle: string; qrContent: string }[]> {
    const response = await this.transport.request<any[]>({
      method: "GET",
      url: `/registrations/my-passes`,
    });
    return response.data ?? [];
  }

  async verifyQr(qrData: string): Promise<{
    valid: boolean;
    user?: { fullName: string; avatarUrl: string | null };
    reason?: string;
    scannedAt?: string | null;
  }> {
    const response = await this.transport.request<any>({
      method: "POST",
      url: `/registration/verify`,
      body: { qrData },
    });
    return response.data;
  }
}
