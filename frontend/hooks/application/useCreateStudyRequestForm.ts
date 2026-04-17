import {
  createStudyRequest,
  getAvailableSubjectsForCurrentUser,
  type Subject,
} from "@/hooks/application/useStudyRequestsCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

interface UseCreateStudyRequestFormParams {
  onCreated?: () => void;
}

export function useCreateStudyRequestForm({ onCreated }: UseCreateStudyRequestFormParams) {
  const role = useAuthStore((s) => s.user?.role);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [maxMembers, setMaxMembers] = useState("4");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const subs = await getAvailableSubjectsForCurrentUser();
      setSubjects(subs);
    } catch (e: any) {
      setFetchError(e?.message ?? "No se pudieron cargar las materias disponibles.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isValid = useMemo(
    () => title.trim().length >= 5 && description.trim().length >= 10 && !!selectedSubject,
    [description, selectedSubject, title]
  );

  const handleCreate = useCallback(async () => {
    if (!isValid || !selectedSubject) return;
    setIsSubmitting(true);
    try {
      await createStudyRequest({
        title: title.trim(),
        description: description.trim(),
        subject_id: selectedSubject,
        max_members: Math.max(2, Math.min(10, parseInt(maxMembers) || 4)),
      });
      Alert.alert(
        "¡Solicitud creada! 🎉",
        "Tu grupo de estudio ya está visible en el feed.",
        [{ text: "Ver feed", onPress: () => onCreated?.() }]
      );
    } catch (e: any) {
      const msg = e?.message ?? "";
      const friendlyMsg = msg.includes("unique_open_request_per_subject")
        ? "Ya tienes una solicitud abierta para esta materia. Ciérrala antes de crear una nueva."
        : msg || "Intenta de nuevo.";
      Alert.alert("Error al crear", friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [description, isValid, maxMembers, onCreated, selectedSubject, title]);

  const decrementMembers = useCallback(() => {
    setMaxMembers((prev) => String(Math.max(2, parseInt(prev) - 1)));
  }, []);

  const incrementMembers = useCallback(() => {
    setMaxMembers((prev) => String(Math.min(10, parseInt(prev) + 1)));
  }, []);

  return {
    role,
    title,
    setTitle,
    description,
    setDescription,
    selectedSubject,
    setSelectedSubject,
    maxMembers,
    subjects,
    loadingData,
    isSubmitting,
    fetchError,
    loadData,
    isValid,
    handleCreate,
    decrementMembers,
    incrementMembers,
  };
}
