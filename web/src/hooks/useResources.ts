import { useCallback } from "react";
import { useResourcesStore } from "@/store/useResourcesStore";
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
  resourceType: string | null;
  ogTitle: string | null;
  ogImage: string | null;
  ogDescription: string | null;
  createdAt: string;
  updatedAt: string;
  profiles?: { fullName: string; avatarUrl: string | null };
  subjects?: { name: string };
}

interface LoadResourcesOptions {
  subjectId?: string;
  userId?: string;
  type?: string;
}

/**
 * Hook para gestionar recursos de estudio respaldado por un store global de Zustand
 */
export default function useResources() {
  const store = useResourcesStore();

  const loadResources = useCallback(
    async (options?: LoadResourcesOptions) => {
      try {
        await store.loadResources(options);
      } catch (err) {
        console.error("Error loading resources:", err);
      }
    },
    [store.loadResources]
  );

  const uploadResource = useCallback(
    async (_data: any) => {
      // Upload/create is handled by SubirRecursoPage flow
      return null;
    },
    []
  );

  const deleteResource = useCallback(async (resourceId: string) => {
    try {
      await deps.apiClients.resources.delete(resourceId);
      store.removeResource(resourceId);
    } catch (err) {
      console.error("Error deleting resource:", err);
      throw err;
    }
  }, [store.removeResource]);

  const refresh = useCallback(
    (options?: LoadResourcesOptions) => {
      return loadResources(options);
    },
    [loadResources]
  );

  // Map the resources from the store to ensure backward compatibility with UI components
  const mappedResources: Resource[] = store.resources.map((r: any) => ({
    id: r.id,
    userId: r.uploaderUserId ?? r.userId ?? "",
    programId: r.programId ?? "",
    subjectId: r.subjectId ?? "",
    title: r.title ?? "",
    description: r.description ?? null,
    fileUrl: r.url ?? r.fileUrl ?? "",
    fileName: r.fileName ?? r.title ?? "",
    fileType: r.fileType ?? r.type ?? null,
    fileSizeKb: r.fileSizeKb ?? null,
    resourceType: r.resourceType ?? r.fileType ?? null,
    ogTitle: r.ogTitle ?? null,
    ogImage: r.ogImage ?? null,
    ogDescription: r.ogDescription ?? null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt?.toISOString?.() ?? "",
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt?.toISOString?.() ?? "",
    profiles: r.profiles ?? undefined,
    subjects: r.subjects ?? undefined,
  }));

  return {
    resources: mappedResources,
    isLoading: store.isLoading,
    error: store.error,
    loadResources,
    uploadResource,
    deleteResource,
    refresh,
  };
}
