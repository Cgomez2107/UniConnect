import { create } from "zustand";
import type { Event as UniversityEvent } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";

export interface EventsState {
  // State
  events: UniversityEvent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEvents(filters?: { category?: string; page?: number; perPage?: number; createdBy?: string }): Promise<void>;
  setEvents(events: UniversityEvent[]): void;
  addEvent(event: UniversityEvent): void;
  updateEvent(event: UniversityEvent): void;
  removeEvent(eventId: string): void;
  setError(error: string | null): void;
}

export function createEventsStore(deps: StoreDeps) {
  const { apiClients, logger } = deps;

  return create<EventsState>()((set, get) => ({
    events: [],
    isLoading: false,
    error: null,

    async loadEvents(filters?: { category?: string; page?: number; perPage?: number }): Promise<void> {
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load events";
        set({ error: errorMessage, isLoading: false });
        logger?.error(`Load events error: ${errorMessage}`);
        throw error;
      }
    },

    setEvents(events: UniversityEvent[]): void {
      set({ events });
      logger?.info(`Events set: ${events.length}`);
    },

    addEvent(event: UniversityEvent): void {
      const current = get().events;
      if (current.some((e) => e.id === event.id)) return;
      set({ events: [...current, event] });
      logger?.info(`Event added: ${event.id}`);
    },

    updateEvent(event: UniversityEvent): void {
      const current = get().events;
      set({
        events: current.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
      });
      logger?.info(`Event updated: ${event.id}`);
    },

    removeEvent(eventId: string): void {
      const current = get().events;
      set({
        events: current.filter((e) => e.id !== eventId),
      });
      logger?.info(`Event removed: ${eventId}`);
    },

    setError(error: string | null): void {
      set({ error });
    },
  }));
}
