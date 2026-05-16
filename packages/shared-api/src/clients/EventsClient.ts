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
  isOnline?: boolean;
  eventUrl?: string;
  capacity?: number;
  tags?: string[];
}

export interface ListEventsFilters {
  page?: number;
  perPage?: number;
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
      },
    });
    return this.ensureArray(response.data).map((dto) => mapEventDtoToDomain(dto));
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
        event_date: payload.eventDate,
        location: payload.location,
        is_online: payload.isOnline,
        event_url: payload.eventUrl,
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
        ...(payload.eventDate !== undefined && { event_date: payload.eventDate }),
        ...(payload.location !== undefined && { location: payload.location }),
        ...(payload.isOnline !== undefined && { is_online: payload.isOnline }),
        ...(payload.eventUrl !== undefined && { event_url: payload.eventUrl }),
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
}
