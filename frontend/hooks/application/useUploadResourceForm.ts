import { useUploadResource } from "@/hooks/application/useUploadResource";
import {
  getAvailableSubjectsForCurrentUser,
  type Subject,
} from "@/hooks/application/useStudyRequestsCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

const ALLOWED_EXTENSIONS = [
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "jpg", "jpeg", "png",
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface PickedFile {
  uri: string;
  name: string;
  size: number;
}

export function useUploadResourceForm() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.user?.role);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { uploading, error: uploadError, upload } = useUploadResource();

  const validateFile = useCallback((fileName: string, sizeBytes: number): string | null => {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      return "Formato no permitido. Usa: pdf, docx, xlsx, pptx, txt, jpg, png.";
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return "El archivo excede el máximo de 10 MB.";
    }
    return null;
  }, []);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const subs = await getAvailableSubjectsForCurrentUser();
      setSubjects(subs);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "No se pudieron cargar las materias disponibles.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      const fileName = asset.name ?? "archivo";
      const fileSize = asset.size ?? 0;

      const validationError = validateFile(fileName, fileSize);
      if (validationError) {
        Alert.alert("Archivo no válido", validationError);
        return;
      }

      setPickedFile({
        uri: asset.uri,
        name: fileName,
        size: fileSize,
      });
    } catch {
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    }
  }, [validateFile]);

  const isValid = useMemo(
    () => title.trim().length >= 3 && !!selectedSubject && !!pickedFile,
    [pickedFile, selectedSubject, title],
  );

  const handleUpload = useCallback(async () => {
    if (!isValid || !selectedSubject || !pickedFile || !user?.id) return;

    let resource = null;
    try {
      resource = await upload({
        subject_id: selectedSubject,
        title: title.trim(),
        description: description.trim() || undefined,
        file_uri: pickedFile.uri,
        file_name: pickedFile.name,
        file_size_bytes: pickedFile.size,
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo subir el recurso.");
      return;
    }

    if (resource) {
      Alert.alert(
        "¡Recurso subido! 📚",
        "Tu recurso ya está disponible para tus compañeros.",
        [{ text: "Aceptar", onPress: () => router.back() }],
      );
    }
  }, [description, isValid, pickedFile, selectedSubject, title, upload, user?.id]);

  const formatSize = useCallback((bytes: number): string => {
    const kb = bytes / 1024;
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${Math.round(kb)} KB`;
  }, []);

  return {
    role,
    title,
    setTitle,
    description,
    setDescription,
    selectedSubject,
    setSelectedSubject,
    pickedFile,
    setPickedFile,
    subjects,
    loadingData,
    fetchError,
    loadData,
    uploading,
    uploadError,
    handlePickFile,
    isValid,
    handleUpload,
    formatSize,
  };
}
