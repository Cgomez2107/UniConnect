import { useState, useCallback } from "react";
import { deps, AUTH_SESSION_KEY } from "@/store/deps";
import type { AdminEvent, EventStatus } from "@/types";

const GATEWAY_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface BackendEvent {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  organizerId?: string;
  organizerName?: string;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  maxCapacity?: number | null;
  registeredCount?: number;
  deletedAt?: string | null;
}

function mapBackendEvent(e: BackendEvent): AdminEvent {
  return {
    id: e.id ?? "",
    title: e.title ?? "",
    description: e.description ?? null,
    event_date: e.startAt ?? "",
    location: e.location ?? null,
    category: e.category ?? "",
    category_id: e.categoryId ?? "",
    status: (e.status ?? "draft") as EventStatus,
    max_capacity: e.maxCapacity ?? null,
    registered_count: e.registeredCount ?? 0,
    image_url: e.imageUrl ?? null,
    created_by: e.organizerId ?? null,
    created_at: e.createdAt ?? "",
    updated_at: e.updatedAt ?? e.createdAt ?? "",
    deleted_at: e.deletedAt ?? null,
    creator_name: e.organizerName ?? "Admin",
  };
}

function getAuthToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function useAdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (includeDeleted: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const url = `${GATEWAY_URL}/events?limit=500&include_deleted=${includeDeleted}&status=draft,published,cancelled,finished`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error ?? `HTTP ${response.status}`);
      }
      const body: { data: BackendEvent[]; meta: { total: number } } = await response.json();
      setEvents((body.data ?? []).map(mapBackendEvent));
      setTotal(body.meta?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  const publishEvent = useCallback(async (id: string): Promise<void> => {
    await deps.transport.request<AdminEvent>({
      method: "POST",
      url: `/events/${id}/publish`,
    });
  }, []);

  const cancelEvent = useCallback(async (id: string): Promise<void> => {
    await deps.transport.request<AdminEvent>({
      method: "POST",
      url: `/events/${id}/cancel`,
    });
  }, []);

  const finishEvent = useCallback(async (id: string): Promise<void> => {
    await deps.transport.request<AdminEvent>({
      method: "POST",
      url: `/events/${id}/finish`,
    });
  }, []);

  const softDeleteEvent = useCallback(async (id: string): Promise<void> => {
    await deps.transport.request<void>({
      method: "DELETE",
      url: `/events/${id}`,
    });
  }, []);

  const createEvent = useCallback(async (payload: {
    title: string;
    description?: string;
    startAt: string;
    location?: string;
    category: string;
    maxCapacity?: number | null;
  }): Promise<AdminEvent> => {
    const response = await deps.transport.request<BackendEvent>({
      method: "POST",
      url: "/events",
      body: {
        title: payload.title,
        description: payload.description ?? "",
        eventDate: payload.startAt,
        location: payload.location,
        category: payload.category,
        capacity: payload.maxCapacity ?? undefined,
      },
    });
    return mapBackendEvent(response.data);
  }, []);

  const updateEvent = useCallback(async (id: string, payload: {
    title?: string;
    description?: string;
    startAt?: string;
    location?: string;
    category?: string;
    imageUrl?: string;
    maxCapacity?: number | null;
  }): Promise<AdminEvent> => {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.startAt !== undefined) body.startAt = payload.startAt;
    if (payload.location !== undefined) body.location = payload.location;
    if (payload.category !== undefined) body.category = payload.category;
    if (payload.imageUrl !== undefined) body.imageUrl = payload.imageUrl;
    if (payload.maxCapacity !== undefined) body.maxCapacity = payload.maxCapacity;

    const response = await deps.transport.request<BackendEvent>({
      method: "PUT",
      url: `/events/${id}`,
      body,
    });
    return mapBackendEvent(response.data);
  }, []);

  return {
    events,
    total,
    loading,
    error,
    fetchEvents,
    publishEvent,
    cancelEvent,
    finishEvent,
    softDeleteEvent,
    createEvent,
    updateEvent,
  };
}
