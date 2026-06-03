import { useCallback } from "react";
import { useEventsStore } from "@/store/useEventsStore";
import eventsService, { mapEvent } from "@/lib/services/events.service";
import { CampusEventUI } from "@/types/ui";

interface CreateEventPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

/**
 * Hook para gestionar eventos del campus respaldado por un store global de Zustand
 */
export default function useEvents() {
  const store = useEventsStore();

  const loadEvents = useCallback(async () => {
    try {
      await store.loadEvents();
    } catch (err) {
      console.error("Error loading events:", err);
    }
  }, [store.loadEvents]);

  const createEvent = useCallback(async (payload: CreateEventPayload) => {
    try {
      const event = await eventsService.createEvent(payload as any);
      store.addEvent(event as any);
      return event;
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  }, [store.addEvent]);

  const updateEvent = useCallback(
    async (eventId: string, payload: Partial<CreateEventPayload>) => {
      try {
        const updated = await eventsService.updateEvent(eventId, payload as any);
        store.updateEvent(updated as any);
        return updated;
      } catch (err) {
        console.error("Error updating event:", err);
        throw err;
      }
    },
    [store.updateEvent]
  );

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await eventsService.deleteEvent(eventId);
      store.removeEvent(eventId);
    } catch (err) {
      console.error("Error deleting event:", err);
      throw err;
    }
  }, [store.removeEvent]);

  const refresh = useCallback(() => {
    return loadEvents();
  }, [loadEvents]);

  const mappedEvents = store.events.map(mapEvent);

  return {
    events: mappedEvents,
    isLoading: store.isLoading,
    error: store.error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh,
  };
}
