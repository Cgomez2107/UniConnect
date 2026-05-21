import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import type { Event } from "@uniconnect/shared-types";
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
}
export declare class EventsClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    list(filters?: ListEventsFilters): Promise<Event[]>;
    getById(id: string): Promise<Event>;
    create(payload: CreateEventPayload): Promise<Event>;
    update(id: string, payload: Partial<CreateEventPayload>): Promise<Event>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=EventsClient.d.ts.map