import { useApplications } from "@/hooks/application/useApplications";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import type { Application } from "@/types";
import { Alert } from "react-native";
import { useEffect, useState } from "react";

export interface RequestDetail {
  id: string;
  author_id: string;
  title: string;
  description: string;
  max_members: number;
  status: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  author_bio?: string;
  subject_name: string;
  faculty_name: string;
}

interface UseRequestDetailParams {
  requestId?: string;
  onRequestCanceled?: () => void;
}

export function useRequestDetail({ requestId, onRequestCanceled }: UseRequestDetailParams) {
  const user = useAuthStore((s) => s.user);
  const {
    getMyApplicationStatus,
    reviewApplication: reviewApplicationUseCase,
    cancelMyApplication,
    getApplicationsByRequest,
  } = useApplications();
  const {
    getRequestById,
    isAdmin: checkIsAdmin,
    getAdmins,
    assignAdmin,
    revokeAdmin,
    updateRequestContent,
    cancelRequest,
    updateStatus,
  } = useStudyRequests();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null);
  const [isRequestAdminRole, setIsRequestAdminRole] = useState(false);
  const [requestAdmins, setRequestAdmins] = useState<string[]>([]);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [updatingAdminUserId, setUpdatingAdminUserId] = useState<string | null>(null);
  const [cancelingAction, setCancelingAction] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<
    "pendiente" | "aceptada" | "rechazada" | null
  >(null);

  const enrichApplicationsWithProfiles = async (apps: Application[]): Promise<Application[]> => {
    if (!apps.length) return apps;

    const needProfileIds = apps
      .filter((app) => !app.profiles?.full_name)
      .map((app) => app.applicant_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (needProfileIds.length === 0) return apps;

    const uniqueIds = Array.from(new Set(needProfileIds));
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", uniqueIds);

    if (error) return apps;

    const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
    for (const row of data ?? []) {
      if (!row?.id) continue;
      profileMap.set(row.id, {
        full_name: row.full_name ?? "Integrante",
        avatar_url: row.avatar_url ?? null,
      });
    }

    return apps.map((app) => {
      if (app.profiles?.full_name) return app;
      const profile = profileMap.get(app.applicant_id);
      if (!profile) return app;
      return {
        ...app,
        profiles: profile,
      };
    });
  };

  useEffect(() => {
    if (!requestId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseRequest = await getRequestById(requestId);
        if (!baseRequest) throw new Error("Solicitud no encontrada.");

        setRequest({
          id: baseRequest.id,
          author_id: baseRequest.author_id,
          title: baseRequest.title,
          description: baseRequest.description,
          max_members: baseRequest.max_members,
          status: baseRequest.status,
          created_at: baseRequest.created_at,
          author_name: baseRequest.profiles?.full_name ?? "Usuario",
          author_avatar: baseRequest.profiles?.avatar_url ?? undefined,
          author_bio: baseRequest.profiles?.bio ?? undefined,
          subject_name: baseRequest.subjects?.name ?? "Sin materia",
          faculty_name: baseRequest.faculty_name ?? "Sin facultad",
        });
        setDescriptionDraft(baseRequest.description ?? "");

        const isAuthor = user?.id ? baseRequest.author_id === user.id : false;
        const canAdmin = user?.id && !isAuthor
          ? await checkIsAdmin(baseRequest.id, user.id)
          : false;

        setIsRequestAdminRole(!!canAdmin);

        if (isAuthor || canAdmin) {
          try {
            const [rawApps, admins] = await Promise.all([
              getApplicationsByRequest(baseRequest.id),
              getAdmins(baseRequest.id),
            ]);

            const apps = await enrichApplicationsWithProfiles(rawApps);
            setApplications(apps);
            setRequestAdmins((admins ?? []).map((a) => a.user_id));
          } catch {
            // Si falla la carga de datos de gestión, no bloqueamos la vista pública de la solicitud.
            setApplications([]);
            setRequestAdmins([]);
          }
        } else {
          setApplications([]);
          setRequestAdmins([]);
        }

        if (user?.id && baseRequest.author_id !== user.id) {
          const status = await getMyApplicationStatus(baseRequest.id, user.id);
          setApplicationStatus(status);
        }
      } catch (e: any) {
        setError(e.message ?? "Error al cargar la solicitud.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    checkIsAdmin,
    getAdmins,
    getApplicationsByRequest,
    getMyApplicationStatus,
    getRequestById,
    requestId,
    user?.id,
  ]);

  const isOwnPost = request?.author_id === user?.id;
  const canManageRequest = !!isOwnPost || isRequestAdminRole;

  const acceptedMembers = applications.filter((app) => app.status === "aceptada");
  const pendingApplications = applications.filter((app) => app.status === "pendiente");
  const occupiedSlots = Math.min(acceptedMembers.length + 1, request?.max_members ?? 0);
  const remainingSlots = Math.max((request?.max_members ?? 0) - occupiedSlots, 0);

  const isExtraAdmin = (userId: string) => requestAdmins.includes(userId);

  const refreshAdminData = async () => {
    if (!request?.id || !user?.id) return;
    const [canAdmin, admins] = await Promise.all([
      checkIsAdmin(request.id, user.id),
      getAdmins(request.id),
    ]);
    setIsRequestAdminRole(canAdmin);
    setRequestAdmins((admins ?? []).map((a) => a.user_id));
  };

  const handleUpdateDescription = async () => {
    if (!request || !user?.id) return;
    const clean = descriptionDraft.trim();
    if (!clean) {
      Alert.alert("Descripcion requerida", "La descripcion no puede quedar vacia.");
      return;
    }

    setIsSavingDescription(true);
    try {
      await updateRequestContent(request.id, user.id, { description: clean });
      setRequest((prev) => (prev ? { ...prev, description: clean } : prev));
      setIsEditingDescription(false);
      Alert.alert("Actualizada", "La descripcion de la solicitud fue actualizada.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo actualizar la descripcion.");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSetAdmin = async (targetUserId: string, makeAdmin: boolean) => {
    if (!request || !user?.id) return;

    setUpdatingAdminUserId(targetUserId);
    try {
      if (makeAdmin) {
        await assignAdmin(request.id, targetUserId, user.id);
      } else {
        await revokeAdmin(request.id, targetUserId, user.id);
      }
      await refreshAdminData();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo actualizar el rol de administrador.");
    } finally {
      setUpdatingAdminUserId(null);
    }
  };

  const handleCancelRequest = () => {
    if (!request || !user?.id) return;

    Alert.alert(
      "Cancelar solicitud",
      "Se cerrara y dejara de estar activa en el feed. ¿Deseas continuar?",
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Cancelar solicitud",
          style: "destructive",
          onPress: async () => {
            setCancelingAction(true);
            try {
              await cancelRequest(request.id, user.id);
              setRequest((prev) => (prev ? { ...prev, status: "cerrada" } : prev));
              Alert.alert("Solicitud cancelada", "La solicitud fue cerrada correctamente.", [
                {
                  text: "OK",
                  onPress: () => onRequestCanceled?.(),
                },
              ]);
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "No se pudo cancelar la solicitud.");
            } finally {
              setCancelingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelMyApplication = () => {
    if (!request || !user?.id) return;

    Alert.alert(
      "Cancelar postulación",
      applicationStatus === "aceptada"
        ? "Saldras del grupo. ¿Deseas continuar?"
        : "Tu postulación sera retirada. ¿Deseas continuar?",
      [
        { text: "Volver", style: "cancel" },
        {
          text: applicationStatus === "aceptada" ? "Salir del grupo" : "Retirar postulación",
          style: "destructive",
          onPress: async () => {
            setCancelingAction(true);
            try {
              await cancelMyApplication(request.id, user.id);
              setApplications((prev) => prev.filter((app) => app.applicant_id !== user.id));
              setApplicationStatus(null);
              await refreshAdminData();
              Alert.alert("Listo", "La cancelacion se realizo correctamente.");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "No se pudo cancelar la postulación.");
            } finally {
              setCancelingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleReviewApplication = async (
    applicationId: string,
    status: "aceptada" | "rechazada"
  ) => {
    if (!user?.id || !request) return;

    setReviewingApplicationId(applicationId);
    try {
      await reviewApplicationUseCase(applicationId, user.id, status);
      const updatedApplications = applications.map((app) =>
        app.id === applicationId ? { ...app, status } : app
      );
      setApplications(updatedApplications);

      if (status === "aceptada" && request.status === "abierta") {
        const acceptedCount = updatedApplications.filter((app) => app.status === "aceptada").length;
        if (acceptedCount + 1 >= request.max_members) {
          await updateStatus(request.id, user.id, "cerrada");
          setRequest((prev) => (prev ? { ...prev, status: "cerrada" } : prev));
          Alert.alert("Cupo completo", "La solicitud se cerro automaticamente porque ya se lleno el cupo.");
        }
      }

      const reviewed = applications.find((app) => app.id === applicationId);
      if (reviewed?.applicant_id === user.id) {
        setApplicationStatus(status);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo actualizar la postulación.");
    } finally {
      setReviewingApplicationId(null);
    }
  };

  return {
    user,
    request,
    loading,
    error,
    applications,
    reviewingApplicationId,
    isRequestAdminRole,
    requestAdmins,
    isSavingDescription,
    isEditingDescription,
    setIsEditingDescription,
    descriptionDraft,
    setDescriptionDraft,
    updatingAdminUserId,
    cancelingAction,
    applicationStatus,
    isOwnPost,
    canManageRequest,
    acceptedMembers,
    pendingApplications,
    occupiedSlots,
    remainingSlots,
    isExtraAdmin,
    handleUpdateDescription,
    handleSetAdmin,
    handleCancelRequest,
    handleCancelMyApplication,
    handleReviewApplication,
  };
}
