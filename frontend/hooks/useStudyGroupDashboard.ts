import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApplications } from "@/hooks/application/useApplications";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import { useApplicationsRealtime } from "@/hooks/useApplicationsRealtime";
import { fetchApi } from "@/lib/api/httpClient";
import { supabase } from "@/lib/supabase";
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

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', uniqueIds);

    if (profilesError) {
      return apps;
    }

    const profileMap = new Map<string, any>();
    if (profilesData) {
      profilesData.forEach((profile) => {
        profileMap.set(profile.id, profile);
      });
    }

    return apps.map((app) => {
      const profile = profileMap.get(app.applicant_id);
      if (!profile) return app;
      return {
        ...app,
        profiles: {
          full_name: profile.full_name ?? "Integrante",
          avatar_url: profile.avatar_url ?? null,
        },
      } as Application;
    });
  }, []);

  const loadMembers = useCallback(
    async (requestIdValue: string) => {
      const data = await fetchApi<StudyGroupMember[]>(`/study-groups/${requestIdValue}/members`);
      const list = data ?? [];
      setMembers(list);
      return list;
    },
    []
  );

  const mapApiMessageToDomain = useCallback((msg: any): GroupMessage => {
    return {
      id: msg.id,
      requestId: msg.request_id || msg.requestId,
      senderId: msg.sender_id || msg.senderId,
      content: msg.content,
      createdAt: msg.created_at || msg.createdAt,
      senderFullName: msg.sender_full_name || msg.senderFullName,
      senderAvatarUrl: msg.sender_avatar_url || msg.senderAvatarUrl,
      media_url: msg.media_url || msg.mediaUrl,
      media_type: msg.media_type || msg.mediaType,
      media_filename: msg.media_filename || msg.mediaFilename,
      mentions: msg.mentions,
      reactions: msg.reactions,
    };
  }, []);

  const loadMessages = useCallback(
    async (requestIdValue: string, currentMembers?: StudyGroupMember[]) => {
      const data = await fetchApi<any[]>(
        `/study-groups/${requestIdValue}/messages?limit=50&page=1`
      );

      let mapped = (data ?? []).map(mapApiMessageToDomain);

      // Enriquecer mensajes históricos con nombres de la lista de miembros
      const membersList = currentMembers || membersRef.current;
      if (membersList.length > 0) {
        mapped = mapped.map((msg) => {
          const member = membersList.find((m) => m.userId === msg.senderId);
          if (member) {
            return {
              ...msg,
              senderFullName: member.fullName,
              senderAvatarUrl: member.avatarUrl,
            };
          }
          return msg;
        });
      }

      const sorted = mapped.slice().sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setMessages(sorted);
    },
    [mapApiMessageToDomain]
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
        // 1. Carga inicial de datos base (solicitud)
        const request = await getRequestById(requestIdValue);
        
        if (!request) {
          setError("No se encontró la solicitud activa.");
          setActiveRequest(null);
          setApplications([]);
          setMembers([]);
          setMessages([]);
          return;
        }

        setActiveRequest(request);

        // 2. Cargar miembros primero para verificar rol
        const loadedMembers = await loadMembers(requestIdValue);

        // 3. Determinar si somos admin para cargar postulaciones (evita 403/500 en miembros)
        const myMemberRecord = loadedMembers.find(m => m.userId === user?.id);
        const isAdmin = myMemberRecord?.role === "admin" || myMemberRecord?.role === "autor";

        let apps: Application[] = [];
        if (isAdmin) {
          try {
            const rawApps = await getApplicationsByRequest(requestIdValue);
            apps = await enrichApplications(rawApps ?? []);
          } catch (err) {
            console.warn("[Dashboard] Error al cargar postulaciones:", err);
            apps = [];
          }
        }
        setApplications(apps);

        // 4. Cargar mensajes (ya tenemos los miembros para enriquecer)
        await loadMessages(requestIdValue, loadedMembers);
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar el dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [enrichApplications, getApplicationsByRequest, getRequestById, loadMembers, loadMessages, user?.id]
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

  // Usar Ref para acceder a los miembros actuales dentro del callback de Realtime sin reiniciar la suscripción
  const membersRef = useRef<StudyGroupMember[]>(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // Suscripción Realtime para mensajes del chat grupal (US-W03)
  useEffect(() => {
    if (!activeRequestId) return;

    console.log(`[Chat] Suscribiendo a grupo: ${activeRequestId}`);
    const channel = supabase
      .channel(`group-chat-${activeRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_messages",
        },
        (payload) => {
          console.log("[Chat] Evento de Realtime recibido (crudo):", payload.new);
          
          // Filtrado manual por robustez (algunas versiones de Realtime tienen problemas con el filter string)
          if (payload.new.request_id !== activeRequestId) {
            console.log(`[Chat] Mensaje ignorado (ID de grupo ${payload.new.request_id} no coincide con ${activeRequestId})`);
            return;
          }
          const newMessage = mapApiMessageToDomain(payload.new);
          
          // Enriquecer con datos del miembro si es posible (Realtime no incluye el JOIN de perfiles)
          const member = membersRef.current.find(m => m.userId === newMessage.senderId);
          if (member) {
            newMessage.senderFullName = member.fullName;
            newMessage.senderAvatarUrl = member.avatarUrl;
          }

          setMessages((prev) => {
            // Evitar duplicados (ej. si el mensaje fue insertado localmente de forma optimista)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            
            const updated = [...prev, newMessage];
            return updated.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Chat] Estado de la suscripción para ${activeRequestId}: ${status}`);
      });

    return () => {
      console.log(`[Chat] Desuscribiendo de grupo: ${activeRequestId}`);
      void supabase.removeChannel(channel);
    };
  }, [activeRequestId, mapApiMessageToDomain]);

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
    async (content: string, mentions?: any[]) => {
      if (!activeRequestId) return;

      const trimmed = content.trim();
      if (!trimmed) return;

      setSendingMessage(true);
      try {
        const created = await fetchApi<any>(
          `/study-groups/${activeRequestId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ 
              content: trimmed,
              mentions: mentions || []
            }),
          }
        );

        // Mapear explícitamente para asegurar consistencia entre camelCase y snake_case
        setMessages((prev) => [...prev, mapApiMessageToDomain(created)]);
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
    [activeRequestId, mapApiMessageToDomain]
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

  const leaveGroup = useCallback(async () => {
    if (!activeRequestId) return;
    try {
      await fetchApi(`/study-groups/${activeRequestId}/leave`, { method: "POST" });
      setActiveRequest(null);
    } catch (err) {
      console.error("Error leaving group:", err);
    }
  }, [activeRequestId]);

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
    loadDashboard,
    loadMessages,
    leaveGroup,
    updateDescription,
    requestAdminTransfer,
  };
}
