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
    createdBy?: string;
    search?: string;
    categories?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}
export declare class EventsClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    list(filters?: ListEventsFilters): Promise<Event[]>;
    listPaginated(filters?: ListEventsFilters): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<Event>;
    create(payload: CreateEventPayload): Promise<Event>;
    update(id: string, payload: Partial<CreateEventPayload>): Promise<Event>;
    delete(id: string): Promise<void>;
    register(eventId: string): Promise<void>;
    unregister(eventId: string): Promise<void>;
    publish(eventId: string): Promise<Event>;
    cancel(eventId: string): Promise<Event>;
    getMyPass(eventId: string): Promise<{
        qrContent: string;
    }>;
    listMyPasses(): Promise<{
        eventId: string;
        eventTitle: string;
        qrContent: string;
    }[]>;
    verifyQr(qrData: string): Promise<{
        valid: boolean;
        user?: {
            fullName: string;
            avatarUrl: string | null;
        };
        reason?: string;
        scannedAt?: string | null;
    }>;
}
//# sourceMappingURL=EventsClient.d.ts.map