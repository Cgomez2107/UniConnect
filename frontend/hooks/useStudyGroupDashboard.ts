import { useCallback, useEffect, useMemo, useState } from "react";

import { useApplications } from "@/hooks/application/useApplications";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import { useApplicationsRealtime } from "@/hooks/useApplicationsRealtime";
import { fetchApi } from "@/lib/api/httpClient";
import { useAuthStore } from "@/store/useAuthStore";
import type { Application, StudyRequest } from "@/types";
import type { GroupMessage, StudyGroupMember } from "@/types/adminDashboard";

interface ToastState {
  title: string;
  message: string;
}

interface UseStudyGroupDashboardOptions {
  requestId?: string;
}

interface PublicProfileSummary {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

function toRelativeLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Solicitado recientemente";

  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "Solicitado hace un momento";
  if (minutes < 60) return `Solicitado hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Solicitado hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Solicitado hace ${days} dias`;

  return `Solicitado el ${parsed.toLocaleDateString("es-PE")}`;
}

function hasCapacityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("23505") || message.toLowerCase().includes("capacidad");
}

export function useStudyGroupDashboard({ requestId }: UseStudyGroupDashboardOptions) {
  const user = useAuthStore((s) => s.user);
  const { getRequestById, getRequestsByAuthor } = useStudyRequests();
  const { getApplicationsByRequest, reviewApplication } = useApplications();

  const [activeRequest, setActiveRequest] = useState<StudyRequest | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [members, setMembers] = useState<StudyGroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [transferingAdmin, setTransferingAdmin] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeRequestId = activeRequest?.id ?? requestId ?? null;

  const pendingApplications = useMemo(
    () => applications.filter((app) => app.status === "pendiente"),
    [applications]
  );

  const stats = useMemo(() => {
    const pending = applications.filter((app) => app.status === "pendiente").length;
    const accepted = applications.filter((app) => app.status === "aceptada").length;
    const rejected = applications.filter((app) => app.status === "rechazada").length;
    return { pending, accepted, rejected };
  }, [applications]);

  const enrichApplications = useCallback(async (apps: Application[]): Promise<Application[]> => {
    const applicantIds = apps
      .map((app) => app.applicant_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const uniqueIds = Array.from(new Set(applicantIds));
    if (uniqueIds.length === 0) return apps;

    const profiles = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          return await fetchApi<PublicProfileSummary>(`/profiles/${id}/public`);
        } catch {
          return null;
        }
      })
    );

    const profileMap = new Map<string, PublicProfileSummary>();
    profiles.forEach((profile) => {
      if (profile?.id) profileMap.set(profile.id, profile);
    });

    return apps.map((app) => {
      const profile = profileMap.get(app.applicant_id);
      if (!profile) return app;
      return {
        ...app,
        profiles: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      } as Application;
    });
  }, []);

  const loadMembers = useCallback(
    async (requestIdValue: string) => {
      const data = await fetchApi<StudyGroupMember[]>(`/study-groups/${requestIdValue}/members`);
      setMembers(data ?? []);
    },
    []
  );

  const loadMessages = useCallback(
    async (requestIdValue: string) => {
      const data = await fetchApi<GroupMessage[]>(
        `/study-groups/${requestIdValue}/messages?limit=50&page=1`
      );

      const sorted = (data ?? []).slice().sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setMessages(sorted);
    },
    []
  );

  const loadApplications = useCallback(
    async (requestIdValue: string) => {
      const result = await getApplicationsByRequest(requestIdValue);
      const enriched = await enrichApplications(result ?? []);
      setApplications(enriched);
    },
    [enrichApplications, getApplicationsByRequest]
  );

  const loadDashboard = useCallback(
    async (requestIdValue: string) => {
      setLoading(true);
      setError(null);

      try {
        const [request, apps] = await Promise.all([
          getRequestById(requestIdValue),
          getApplicationsByRequest(requestIdValue),
        ]);

        if (!request) {
          setError("No se encontro la solicitud activa.");
          setActiveRequest(null);
          setApplications([]);
          return;
        }

        setActiveRequest(request);
        const enriched = await enrichApplications(apps ?? []);
        setApplications(enriched);

        await Promise.all([
          loadMembers(requestIdValue),
          loadMessages(requestIdValue),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar el dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [enrichApplications, getApplicationsByRequest, getRequestById, loadMembers, loadMessages]
  );

  const resolveRequest = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (requestId) {
      await loadDashboard(requestId);
      return;
    }

    const myRequests = await getRequestsByAuthor(user.id);
    const selected = myRequests.find((r) => r.status === "abierta") ?? myRequests[0];

    if (!selected) {
      setActiveRequest(null);
      setApplications([]);
      setMembers([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    await loadDashboard(selected.id);
  }, [getRequestsByAuthor, loadDashboard, requestId, user?.id]);

  useEffect(() => {
    resolveRequest();
  }, [resolveRequest]);

  const refreshFromRealtime = useCallback(() => {
    if (!activeRequestId) return;
    void loadApplications(activeRequestId);
    void loadMembers(activeRequestId);
  }, [activeRequestId, loadApplications, loadMembers]);

  useApplicationsRealtime({
    requestId: activeRequestId,
    onChange: refreshFromRealtime,
  });

  const handleReviewApplication = useCallback(
    async (applicationId: string, decision: "aceptada" | "rechazada") => {
      if (!user?.id || !activeRequestId) return;

      setReviewingApplicationId(applicationId);
      try {
        await reviewApplication(applicationId, user.id, decision);

        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, status: decision } : app))
        );

        await loadMembers(activeRequestId);
      } catch (err) {
        if (hasCapacityError(err)) {
          setToast({
            title: "Cupo completo",
            message: "Se alcanzo el limite de grupos para esta solicitud.",
          });
        } else {
          const message = err instanceof Error ? err.message : "No se pudo actualizar la solicitud.";
          setToast({
            title: "Error al revisar",
            message,
          });
        }
      } finally {
        setReviewingApplicationId(null);
      }
    },
    [activeRequestId, loadMembers, reviewApplication, user?.id]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeRequestId) return;

      const trimmed = content.trim();
      if (!trimmed) return;

      setSendingMessage(true);
      try {
        const created = await fetchApi<GroupMessage>(
          `/study-groups/${activeRequestId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content: trimmed }),
          }
        );

        setMessages((prev) => [...prev, created]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
        setToast({
          title: "Error de envio",
          message,
        });
      } finally {
        setSendingMessage(false);
      }
    },
    [activeRequestId]
  );

  const requestAdminTransfer = useCallback(
    async (targetUserId: string) => {
      if (!activeRequestId) return;

      setTransferingAdmin(true);
      try {
        await fetchApi(`/study-groups/${activeRequestId}/transfer`, {
          method: "POST",
          body: JSON.stringify({ targetUserId }),
        });
        setToast({
          title: "Transferencia solicitada",
          message: "El nuevo administrador debe aceptar para completar la salida.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo solicitar la transferencia.";
        setToast({
          title: "Error al transferir",
          message,
        });
      } finally {
        setTransferingAdmin(false);
      }
    },
    [activeRequestId]
  );

  const pendingCards = useMemo(
    () =>
      pendingApplications.map((app) => ({
        id: app.id,
        applicantId: app.applicant_id,
        name: app.profiles?.full_name ?? "Integrante",
        avatarUrl: app.profiles?.avatar_url ?? null,
        timeLabel: toRelativeLabel(app.created_at),
      })),
    [pendingApplications]
  );

  const updateDescription = useCallback(
    async (description: string) => {
      if (!activeRequestId) return;
      try {
        await fetchApi(`/study-groups/${activeRequestId}`, {
          method: "PATCH",
          body: JSON.stringify({ description }),
        });
        setActiveRequest((prev) => (prev ? { ...prev, description } : null));
        setToast({
          title: "Descripción actualizada",
          message: "Los cambios se guardaron correctamente.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo actualizar la descripción.";
        setToast({
          title: "Error al actualizar",
          message,
        });
      }
    },
    [activeRequestId]
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    activeRequest,
    activeRequestId,
    applications,
    pendingApplications,
    pendingCards,
    members,
    messages,
    stats,
    loading,
    error,
    reviewingApplicationId,
    sendingMessage,
    transferingAdmin,
    toast,
    dismissToast,
    handleReviewApplication,
    handleSendMessage,
    requestAdminTransfer,
    updateDescription,
  };
}
