import { useState, useCallback } from "react";
import { fetchApi } from "@/lib/api/httpClient";

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

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(
    async (groupId: string, from?: string, to?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        const endpoint = `/study-groups/${groupId}/sessions${qs ? `?${qs}` : ""}`;
        const data = await fetchApi<StudySession[]>(endpoint);
        setSessions(data ?? []);
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
      await fetchApi(`/study-groups/sessions/${sessionId}`, {
        method: "DELETE",
      });
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
        const data = await fetchApi<StudySession[]>(
          `/study-groups/${groupId}/sessions/series`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        setSessions((prev) => [...prev, ...(data ?? [])]);
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

  return {
    sessions,
    loading,
    error,
    loadSessions,
    cancelSession,
    createSeries,
  };
}
