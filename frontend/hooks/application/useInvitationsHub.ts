import { useApplications } from "@/hooks/application/useApplications";
import { useResources } from "@/hooks/application/useResources";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import { useAuthStore } from "@/store/useAuthStore";
import type { Application, StudyRequest, StudyResource } from "@/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

export type MainTab = "mis-solicitudes" | "mis-postulaciones" | "mis-recursos";
export type SentFilter = "pendiente" | "aceptada" | "rechazada";

export interface RequestWithApplications {
  request: StudyRequest;
  applications: Application[];
}

export function useInvitationsHub() {
  const user = useAuthStore((s) => s.user);
  const { reviewApplication, getReceivedByAuthor, getByApplicant } = useApplications();
  const { getRequestsByAuthor } = useStudyRequests();
  const { getResourcesByUser } = useResources();

  const [activeTab, setActiveTab] = useState<MainTab>("mis-solicitudes");
  const [sentFilter, setSentFilter] = useState<SentFilter>("pendiente");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<StudyRequest[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
  const [sentApplications, setSentApplications] = useState<Application[]>([]);
  const [myResources, setMyResources] = useState<StudyResource[]>([]);

  const loadHub = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [requests, received, sent, resources] = await Promise.all([
          getRequestsByAuthor(user.id),
          getReceivedByAuthor(user.id),
          getByApplicant(user.id),
          getResourcesByUser(user.id),
        ]);

        setMyRequests(requests);
        setReceivedApplications(received);
        setSentApplications(sent);
        setMyResources(resources);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "No se pudo cargar tu espacio de solicitudes.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getByApplicant, getReceivedByAuthor, getRequestsByAuthor, getResourcesByUser, user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadHub();
    }, [loadHub])
  );

  const requestsWithApplications: RequestWithApplications[] = useMemo(() => {
    const byRequest = new Map<string, Application[]>();
    for (const app of receivedApplications) {
      const current = byRequest.get(app.request_id) ?? [];
      current.push(app);
      byRequest.set(app.request_id, current);
    }

    return myRequests.map((request) => ({
      request,
      applications: byRequest.get(request.id) ?? [],
    }));
  }, [myRequests, receivedApplications]);

  const filteredSent = useMemo(
    () => sentApplications.filter((app) => app.status === sentFilter),
    [sentApplications, sentFilter]
  );

  const counts = useMemo(() => {
    const pendingReceived = receivedApplications.filter((a) => a.status === "pendiente").length;
    const acceptedSent = sentApplications.filter((a) => a.status === "aceptada").length;
    const pendingSent = sentApplications.filter((a) => a.status === "pendiente").length;

    return {
      pendingReceived,
      acceptedSent,
      pendingSent,
    };
  }, [receivedApplications, sentApplications]);

  const listData =
    activeTab === "mis-solicitudes"
      ? requestsWithApplications
      : activeTab === "mis-postulaciones"
      ? filteredSent
      : myResources;

  const handleReview = (applicationId: string, status: "aceptada" | "rechazada") => {
    if (!user?.id) {
      Alert.alert("Sesion requerida", "Debes iniciar sesion para gestionar solicitudes.");
      return;
    }

    const confirmTitle = status === "aceptada" ? "Aceptar postulación" : "Rechazar postulación";
    const confirmBody =
      status === "aceptada"
        ? "¿Quieres aceptar a este estudiante en tu solicitud?"
        : "¿Quieres rechazar esta postulación?";

    Alert.alert(confirmTitle, confirmBody, [
      { text: "Cancelar", style: "cancel" },
      {
        text: status === "aceptada" ? "Aceptar" : "Rechazar",
        style: status === "rechazada" ? "destructive" : "default",
        onPress: async () => {
          setActionId(applicationId);
          try {
            await reviewApplication(applicationId, user.id, status);
            setReceivedApplications((prev) =>
              prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
            );
            setSentApplications((prev) =>
              prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
            );
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "No se pudo actualizar la postulación.");
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  return {
    activeTab,
    setActiveTab,
    sentFilter,
    setSentFilter,
    loading,
    refreshing,
    actionId,
    sentApplications,
    counts,
    listData,
    loadHub,
    handleReview,
    requestsWithApplications,
    filteredSent,
  };
}
