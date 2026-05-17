import { useState, useEffect, useMemo, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import studyGroupsService from "@/lib/services/studyGroups.service";
import type { StudyApplication } from "@uniconnect/shared-types";

export interface PostulationFormData {
  request: any;
  loadingRequest: boolean;
  message: string;
  setMessage: (v: string) => void;
  sending: boolean;
  isClosed: boolean;
  isSubmitDisabled: boolean;
  handlePostular: () => Promise<void>;
  submitError: string | null;
}

export function usePostulationForm(requestId?: string): PostulationFormData {
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await studyGroupsService.getStudyGroupById(requestId);
        if (!cancelled) setRequest(data);
      } catch {
      } finally {
        if (!cancelled) setLoadingRequest(false);
      }
    })();

    return () => { cancelled = true; };
  }, [requestId]);

  const isClosed = !request || request.status !== "abierta" || (request.is_active !== undefined ? !request.is_active : false);
  const isMessageTooShort = message.trim().length < 10;

  const isSubmitDisabled = useMemo(
    () => sending || isMessageTooShort || isClosed,
    [sending, isMessageTooShort, isClosed]
  );

  const handlePostular = useCallback(async () => {
    if (!user || !requestId) {
      throw new Error("Debes iniciar sesión para postularte.");
    }

    if (!request || request.status !== "abierta") {
      throw new Error("Esta convocatoria ya no está activa.");
    }

    if (message.trim().length < 10) {
      throw new Error("Escribe al menos 10 caracteres para presentarte.");
    }

    setSending(true);
    setSubmitError(null);

    try {
      const myApps: StudyApplication[] = await studyGroupsService.listMyApplications();
      const existingApp = myApps.find((a) => a.groupId === requestId);
      if (existingApp && existingApp.status !== "rechazada") {
        throw new Error("Ya te postulaste a esta solicitud.");
      }

      await studyGroupsService.applyToStudyGroup(requestId, message.trim());
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || err?.message || "No se pudo enviar la postulación."
      );
      throw err;
    } finally {
      setSending(false);
    }
  }, [user, requestId, request, message]);

  return {
    request,
    loadingRequest,
    message,
    setMessage,
    sending,
    isClosed,
    isSubmitDisabled,
    handlePostular,
    submitError,
  };
}
