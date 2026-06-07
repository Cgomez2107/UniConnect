import type { Event as UniversityEvent } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";
export interface EventsState {
    events: UniversityEvent[];
    isLoading: boolean;
    error: string | null;
    loadEvents(filters?: {
        category?: string;
        page?: number;
        perPage?: number;
    }): Promise<void>;
    setEvents(events: UniversityEvent[]): void;
    addEvent(event: UniversityEvent): void;
    updateEvent(event: UniversityEvent): void;
    removeEvent(eventId: string): void;
    setError(error: string | null): void;
}
export declare function createEventsStore(deps: StoreDeps): import("zustand").UseBoundStore<import("zustand").StoreApi<EventsState>>;
//# sourceMappingURL=createEventsStore.d.ts.map