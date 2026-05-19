import { useState, useCallback } from "react";
import { deps } from "@/store/deps";

interface Resource {
  id: string;
  userId: string;
  programId: string;
  subjectId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string | null;
  fileSizeKb: number | null;
  createdAt: string;
  updatedAt: string;
  profiles?: { fullName: string; avatarUrl: string | null };
  subjects?: { name: string };
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
interface LoadResourcesOptions {
  subjectId?: string;
  userId?: string;
}

export default function useResources() {
  const [state, setState] = useState<UseResourcesState>({
    resources: [],
    isLoading: false,
    error: null,
  });

  const loadResources = useCallback(
    async (options?: LoadResourcesOptions) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = options?.userId
          ? await deps.apiClients.resources.getMyResources(options.userId)
          : options?.subjectId
            ? await deps.apiClients.resources.getBySubject(options.subjectId)
            : await deps.apiClients.resources.list();

        const resources = (data as any[]).map((r: any) => ({
          id: r.id,
          userId: r.uploaderUserId ?? r.userId,
          programId: r.programId,
          subjectId: r.subjectId,
          title: r.title,
          description: r.description ?? null,
          fileUrl: r.url,
          fileName: r.title,
          fileType: r.type ?? null,
          fileSizeKb: null,
          createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt?.toISOString?.() ?? "",
          updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt?.toISOString?.() ?? "",
          profiles: r.profiles ?? undefined,
          subjects: r.subjects ?? undefined,
        }));

        setState({ resources, isLoading: false, error: null });
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
    async (_data: FormData | Partial<Resource>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        // Upload/create is handled by SubirRecursoPage flow with StorageService + ResourcesClient.create.
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
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
      await deps.apiClients.resources.delete(resourceId);
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
    (options?: LoadResourcesOptions) => {
      return loadResources(options);
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
