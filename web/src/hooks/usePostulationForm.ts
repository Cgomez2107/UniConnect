import { useState, useEffect, useMemo, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import studyGroupsService from "@/lib/services/studyGroups.service";
import type { Application } from "@/types";

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
    if (!user || !requestId) return;

    if (!request || request.status !== "abierta") {
      setSubmitError("Esta convocatoria ya no está activa.");
      return;
    }

    if (message.trim().length < 10) {
      setSubmitError("Escribe al menos 10 caracteres para presentarte.");
      return;
    }

    setSending(true);
    setSubmitError(null);

    try {
      const myApps: Application[] = await studyGroupsService.listMyApplications();
      const alreadyApplied = myApps.some((a) => a.request_id === requestId);
      if (alreadyApplied) {
        setSubmitError("Ya te postulaste a esta solicitud.");
        return;
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
