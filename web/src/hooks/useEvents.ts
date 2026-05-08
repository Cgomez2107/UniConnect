import { useState, useCallback } from "react";
import eventsService from "@/lib/services/events.service";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  createdBy: string;
}

interface CreateEventPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

interface UseEventsState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar eventos del campus
 *
 * @returns {Object} Estado y métodos de eventos
 * @returns {Event[]} events - Lista de eventos
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} loadEvents - Carga los eventos
 * @returns {Function} createEvent - Crea un nuevo evento
 * @returns {Function} updateEvent - Actualiza un evento
 * @returns {Function} deleteEvent - Elimina un evento
 * @returns {Function} refresh - Recarga los eventos
 *
 * @example
 * const { events, createEvent, loadEvents } = useEvents();
 * await loadEvents();
 * await createEvent({ title: "Charla", description: "...", startDate: "..." });
 */
export default function useEvents() {
  const [state, setState] = useState<UseEventsState>({
    events: [],
    isLoading: false,
    error: null,
  });

  const loadEvents = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await eventsService.listEvents();
      setState({ events: data as Event[], isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando eventos";
      console.error("Error loading events:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const createEvent = useCallback(async (payload: CreateEventPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const event = await eventsService.createEvent(payload as any);
      setState((prev) => ({
        ...prev,
        events: [...prev.events, event as Event],
        isLoading: false,
      }));
      return event;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error creando evento";
      console.error("Error creating event:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const updateEvent = useCallback(
    async (eventId: string, payload: Partial<CreateEventPayload>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const updated = await eventsService.updateEvent(eventId, payload as any);
        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) => (e.id === eventId ? updated as Event : e)),
          isLoading: false,
        }));
        return updated;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error actualizando evento";
        console.error("Error updating event:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  const deleteEvent = useCallback(async (eventId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await eventsService.deleteEvent(eventId);
      setState((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== eventId),
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error eliminando evento";
      console.error("Error deleting event:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    return loadEvents();
  }, [loadEvents]);

  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh,
  };
}
