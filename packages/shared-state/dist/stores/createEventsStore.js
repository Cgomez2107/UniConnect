import { create } from "zustand";
export function createEventsStore(deps) {
    const { apiClients, logger } = deps;
    return create()((set, get) => ({
        events: [],
        isLoading: false,
        error: null,
        async loadEvents(filters) {
            try {
                set({ isLoading: true, error: null });
                logger?.info("Loading events");
                const client = apiClients.events;
                if (!client) {
                    throw new Error("events API client not provided");
                }
                const events = await client.list(filters);
                set({ events, isLoading: false });
                logger?.info(`Loaded ${events.length} events`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load events";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Load events error: ${errorMessage}`);
                throw error;
            }
        },
        setEvents(events) {
            set({ events });
            logger?.info(`Events set: ${events.length}`);
        },
        addEvent(event) {
            const current = get().events;
            if (current.some((e) => e.id === event.id))
                return;
            set({ events: [...current, event] });
            logger?.info(`Event added: ${event.id}`);
        },
        updateEvent(event) {
            const current = get().events;
            set({
                events: current.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
            });
            logger?.info(`Event updated: ${event.id}`);
        },
        removeEvent(eventId) {
            const current = get().events;
            set({
                events: current.filter((e) => e.id !== eventId),
            });
            logger?.info(`Event removed: ${eventId}`);
        },
        setError(error) {
            set({ error });
        },
    }));
}
//# sourceMappingURL=createEventsStore.js.map