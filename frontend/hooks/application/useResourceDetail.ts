import { useDeleteResource } from "@/hooks/application/useDeleteResource";
import { useResources } from "@/hooks/application/useResources";
import { useAuthStore } from "@/store/useAuthStore";
import type { StudyResource } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseResourceDetailParams {
  resourceId?: string;
  onDeleted?: () => void;
}

export function useResourceDetail({ resourceId, onDeleted }: UseResourceDetailParams) {
  const user = useAuthStore((s) => s.user);
  const { deleting, remove } = useDeleteResource();
  const { getResourceById, updateResource } = useResources();

  const [resource, setResource] = useState<StudyResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const isOwn = resource?.user_id === user?.id;

  useEffect(() => {
    if (!resourceId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getResourceById(resourceId);
        if (!data) throw new Error("Recurso no encontrado.");
        setResource(data);
        setEditTitle(data.title);
        setEditDescription(data.description ?? "");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar el recurso.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [getResourceById, resourceId]);

  const handleDownload = useCallback(async () => {
    if (!resource) return;
    setDownloading(true);
    try {
      const fileUri = FileSystem.cacheDirectory + resource.file_name;
      const { uri } = await FileSystem.downloadAsync(resource.file_url, fileUri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Descargado", `Archivo guardado en: ${uri}`);
      }
    } catch {
      Alert.alert("Error", "No se pudo descargar el archivo.");
    } finally {
      setDownloading(false);
    }
  }, [resource]);

  const handleSave = useCallback(async () => {
    if (!resource || !user?.id || editTitle.trim().length < 3) {
      Alert.alert("Error", "El título debe tener al menos 3 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateResource(resource.id, user.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setResource(updated);
      setEditing(false);
      Alert.alert("Actualizado", "El recurso se actualizó correctamente.");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  }, [editDescription, editTitle, resource, updateResource, user?.id]);

  const handleDelete = useCallback(() => {
    if (!resource) return;

    Alert.alert(
      "Eliminar recurso",
      `¿Deseas eliminar "${resource.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "⚠️ Confirmar eliminación",
              "Esta acción no se puede deshacer. El archivo se eliminará permanentemente.",
              [
                { text: "No, cancelar", style: "cancel" },
                {
                  text: "Eliminar definitivamente",
                  style: "destructive",
                  onPress: async () => {
                    const success = await remove(resource.id, resource.file_url);
                    if (success) {
                      Alert.alert("Eliminado", "El recurso fue eliminado.", [
                        { text: "OK", onPress: () => onDeleted?.() },
                      ]);
                    } else {
                      Alert.alert("Error", "No se pudo eliminar el recurso.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [onDeleted, remove, resource]);

  const cancelEditing = useCallback(() => {
    if (!resource) return;
    setEditing(false);
    setEditTitle(resource.title);
    setEditDescription(resource.description ?? "");
  }, [resource]);

  return {
    user,
    resource,
    loading,
    error,
    editing,
    setEditing,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    saving,
    deleting,
    downloading,
    isOwn,
    handleDownload,
    handleSave,
    handleDelete,
    cancelEditing,
  };
}
