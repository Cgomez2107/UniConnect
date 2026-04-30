import { useApplications } from "@/hooks/application/useApplications";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

export interface RequestSummary {
  title: string;
  author_name: string;
  subject_name: string;
  status: string;
  is_active: boolean;
}

interface UsePostulationFormParams {
  requestId?: string;
  onApplied?: () => void;
}

export function usePostulationForm({ requestId, onApplied }: UsePostulationFormParams) {
  const user = useAuthStore((s) => s.user);
  const { applyToRequest, getMyApplicationStatus } = useApplications();
  const { getRequestById } = useStudyRequests();

  const [request, setRequest] = useState<RequestSummary | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    (async () => {
      const baseRequest = await getRequestById(requestId);

      if (baseRequest) {
        setRequest({
          title: baseRequest.title,
          author_name: baseRequest.profiles?.full_name ?? "Usuario",
          subject_name: baseRequest.subjects?.name ?? "Materia",
          status: baseRequest.status,
          is_active: baseRequest.is_active,
        });
      }
      setLoadingRequest(false);
    })();
  }, [getRequestById, requestId]);

  const isClosed = !request || request.status !== "abierta" || !request.is_active;
  const isMessageTooShort = message.trim().length < 10;

  const isSubmitDisabled = useMemo(
    () => sending || isMessageTooShort || isClosed,
    [isClosed, isMessageTooShort, sending]
  );

  const handlePostular = async () => {
    if (!user || !requestId) return;
    if (!request || request.status !== "abierta" || !request.is_active) {
      Alert.alert("Convocatoria cerrada", "Esta convocatoria ya no esta activa.");
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert("Mensaje muy corto", "Escribe al menos 10 caracteres para presentarte.");
      return;
    }
    setSending(true);
    try {
      const existingStatus = await getMyApplicationStatus(requestId, user.id);
      if (existingStatus) {
        Alert.alert("Postulación existente", "Ya te postulaste a esta solicitud.");
        return;
      }

      await applyToRequest(requestId, user.id, message.trim(), user.fullName);
      onApplied?.();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo enviar la postulación.");
    } finally {
      setSending(false);
    }
  };

  return {
    request,
    loadingRequest,
    message,
    setMessage,
    sending,
    isClosed,
    isSubmitDisabled,
    handlePostular,
  };
}
