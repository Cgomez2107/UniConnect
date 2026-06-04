import { useState, useCallback } from "react";
import { deps } from "@/store/deps";

export interface StudySession {
  id: string;
  groupId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  rrule?: string | null;
  parentSeriesId?: string | null;
  cancelledAt?: string | null;
}

export interface SessionAttendee {
  id: string;
  sessionId: string;
  userId: string;
  status: "pending" | "confirmed" | "declined";
  fullName?: string | null;
  avatarUrl?: string | null;
}

// Map from StudySessionDTO to StudySession
function mapSessionDTOtoUI(dto: any): StudySession {
  return {
    id: dto.id,
    groupId: dto.request_id || dto.groupId,
    title: dto.title,
    description: dto.description || "",
    startTime: dto.start_time || dto.startTime,
    endTime: dto.end_time || dto.endTime,
    rrule: dto.rrule || null,
    parentSeriesId: dto.parent_series_id || dto.parentSeriesId || null,
    cancelledAt: dto.cancelled_at || dto.cancelledAt || null,
  };
}

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(
    async (groupId: string, from?: string, to?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await deps.apiClients.studySessions.listByGroup(
          groupId,
          from || "",
          to || "",
        );
        setSessions(data.map(mapSessionDTOtoUI));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al cargar sesiones";
        setError(message);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const cancelSession = useCallback(async (sessionId: string) => {
    try {
      await deps.apiClients.studySessions.cancel(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cancelar sesión";
      setError(message);
      return false;
    }
  }, []);

  const createSeries = useCallback(
    async (
      groupId: string,
      payload: {
        title: string;
        description?: string;
        startTime: string;
        endTime: string;
        rrule?: string;
        weekCount?: number;
      },
    ) => {
      try {
        const data = await deps.apiClients.studySessions.createSeries(groupId, payload);
        setSessions((prev) => [...prev, ...(data.map(mapSessionDTOtoUI) ?? [])]);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al crear serie";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const updateAvailability = useCallback(
    async (sessionId: string, status: "confirmed" | "declined", userName?: string) => {
      try {
        // Use direct fetch since updateAvailability might not be in the client yet
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/study-groups/sessions/${sessionId}/availability`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ status, userName }),
          },
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error al actualizar disponibilidad");
        }
        const attendee = await response.json();
        return attendee;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al actualizar disponibilidad";
        setError(message);
        throw err;
      }
    },
    [],
  );

  return {
    sessions,
    loading,
    error,
    loadSessions,
    cancelSession,
    createSeries,
    updateAvailability,
  };
}
