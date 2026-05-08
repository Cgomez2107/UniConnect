import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  subjectId?: string;
}

interface UseResourcesState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar recursos de estudio
 *
 * @returns {Object} Estado y métodos de recursos
 * @returns {Resource[]} resources - Lista de recursos
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} loadResources - Carga los recursos
 * @returns {Function} uploadResource - Sube un nuevo recurso
 * @returns {Function} deleteResource - Elimina un recurso
 * @returns {Function} refresh - Recarga los recursos
 *
 * @example
 * const { resources, uploadResource, deleteResource } = useResources();
 * await loadResources(subjectId);
 * await uploadResource({ title: "Apuntes", file });
 */
export default function useResources() {
  const [state, setState] = useState<UseResourcesState>({
    resources: [],
    isLoading: false,
    error: null,
  });

  const loadResources = useCallback(
    async (subjectId?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const endpoint = subjectId
          ? `/resources?subjectId=${subjectId}`
          : "/resources";
        const response = await apiClient.get<{ data: Resource[] }>(endpoint);
        setState({ resources: response.data.data, isLoading: false, error: null });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error cargando recursos";
        console.error("Error loading resources:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  const uploadResource = useCallback(
    async (data: FormData | Partial<Resource>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await apiClient.post<{ data: Resource }>(
          "/resources",
          data
        );
        setState((prev) => ({
          ...prev,
          resources: [...prev.resources, response.data.data],
          isLoading: false,
        }));
        return response.data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error subiendo recurso";
        console.error("Error uploading resource:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  const deleteResource = useCallback(async (resourceId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiClient.delete(`/resources/${resourceId}`);
      setState((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.id !== resourceId),
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error eliminando recurso";
      console.error("Error deleting resource:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const refresh = useCallback(
    (subjectId?: string) => {
      return loadResources(subjectId);
    },
    [loadResources]
  );

  return {
    resources: state.resources,
    isLoading: state.isLoading,
    error: state.error,
    loadResources,
    uploadResource,
    deleteResource,
    refresh,
  };
}
