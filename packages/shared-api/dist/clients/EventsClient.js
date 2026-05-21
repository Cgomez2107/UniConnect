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
                event_date: payload.eventDate,
                location: payload.location,
                category: payload.category,
                is_online: payload.isOnline,
                event_url: payload.eventUrl,
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
                ...(payload.eventDate !== undefined && { event_date: payload.eventDate }),
                ...(payload.location !== undefined && { location: payload.location }),
                ...(payload.category !== undefined && { category: payload.category }),
                ...(payload.isOnline !== undefined && { is_online: payload.isOnline }),
                ...(payload.eventUrl !== undefined && { event_url: payload.eventUrl }),
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
}
//# sourceMappingURL=EventsClient.js.map