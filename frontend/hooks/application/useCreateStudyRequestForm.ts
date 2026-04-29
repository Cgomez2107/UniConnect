import {
  createStudyRequest,
  getAvailableSubjectsForCurrentUser,
  getStudyRequestCountBySubject,
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
  const [subjectGroupCount, setSubjectGroupCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(false);

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

  // Validar límite de grupos al seleccionar materia
  useEffect(() => {
    if (selectedSubject) {
      setLoadingCount(true);
      getStudyRequestCountBySubject(selectedSubject)
        .then(setSubjectGroupCount)
        .catch(console.error)
        .finally(() => setLoadingCount(false));
    } else {
      setSubjectGroupCount(0);
    }
  }, [selectedSubject]);

  const isValid = useMemo(
    () => title.trim().length >= 5 && description.trim().length >= 10 && !!selectedSubject && subjectGroupCount < 3,
    [description, selectedSubject, title, subjectGroupCount]
  );

  const handleCreate = useCallback(async () => {
    if (!isValid || !selectedSubject) return;

    if (subjectGroupCount >= 3) {
      Alert.alert(
        "Límite alcanzado",
        "Ya existen 3 grupos para esta asignatura. Te sugerimos unirte a uno existente para concentrar la colaboración."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudyRequest({
        title: title.trim(),
        description: description.trim(),
        subject_id: selectedSubject,
        max_members: Math.max(2, Math.min(10, parseInt(maxMembers) || 4)),
      });

      Alert.alert(
        "¡Éxito! 🎉",
        "¡Solicitud creada correctamente!",
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
  }, [description, isValid, maxMembers, onCreated, selectedSubject, title, subjectGroupCount]);

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
    subjectGroupCount,
    loadingCount,
  };
}
