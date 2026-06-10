import { BaseClient } from "./BaseClient.js";
import { mapEventDtoToDomain, } from "../mappers/index.js";
export class EventsClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async list(filters) {
        const response = await this.transport.request({
            method: "GET",
            url: "/events",
            params: {
                ...(filters?.page !== undefined && { page: filters.page }),
                ...(filters?.perPage !== undefined && { per_page: filters.perPage }),
                ...(filters?.createdBy !== undefined && { created_by: filters.createdBy }),
            },
        });
        return this.ensureArray(response.data).map((dto) => mapEventDtoToDomain(dto));
    }
    async getById(id) {
        const response = await this.transport.request({
            method: "GET",
            url: `/events/${id}`,
        });
        return mapEventDtoToDomain(response.data);
    }
    async create(payload) {
        const response = await this.transport.request({
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
    async update(id, payload) {
        const response = await this.transport.request({
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
    async delete(id) {
        await this.transport.request({
            method: "DELETE",
            url: `/events/${id}`,
        });
    }
    async register(eventId) {
        await this.transport.request({
            method: "POST",
            url: `/events/${eventId}/register`,
        });
    }
    async publish(eventId) {
        const response = await this.transport.request({
            method: "POST",
            url: `/events/${eventId}/publish`,
        });
        return mapEventDtoToDomain(response.data);
    }
    async cancel(eventId) {
        const response = await this.transport.request({
            method: "POST",
            url: `/events/${eventId}/cancel`,
        });
        return mapEventDtoToDomain(response.data);
    }
}
//# sourceMappingURL=EventsClient.js.map