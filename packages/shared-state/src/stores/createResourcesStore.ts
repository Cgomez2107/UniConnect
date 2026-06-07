import { create } from "zustand";
import type { StudyResource } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";

export interface ResourcesState {
  // State
  resources: StudyResource[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadResources(filters?: { subjectId?: string; type?: string; userId?: string }): Promise<void>;
  setResources(resources: StudyResource[]): void;
  addResource(resource: StudyResource): void;
  updateResource(resource: StudyResource): void;
  removeResource(resourceId: string): void;
  setError(error: string | null): void;
}

export function createResourcesStore(deps: StoreDeps) {
  const { apiClients, logger } = deps;

  return create<ResourcesState>()((set, get) => ({
    resources: [],
    isLoading: false,
    error: null,

    async loadResources(filters?: { subjectId?: string; type?: string; userId?: string }): Promise<void> {
      try {
        set({ isLoading: true, error: null });
        logger?.info("Loading study resources");

        const client = apiClients.resources;
        if (!client) {
          throw new Error("resources API client not provided");
        }

        const resources = filters?.userId
          ? await client.getMyResources(filters.userId)
          : await client.list({
              subjectId: filters?.subjectId,
              type: filters?.type,
            });

        set({ resources, isLoading: false });
        logger?.info(`Loaded ${resources.length} resources`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load resources";
        set({ error: errorMessage, isLoading: false });
        logger?.error(`Load resources error: ${errorMessage}`);
        throw error;
      }
    },

    setResources(resources: StudyResource[]): void {
      set({ resources });
      logger?.info(`Resources set: ${resources.length}`);
    },

    addResource(resource: StudyResource): void {
      const current = get().resources;
      if (current.some((r) => r.id === resource.id)) return;
      set({ resources: [...current, resource] });
      logger?.info(`Resource added: ${resource.id}`);
    },

    updateResource(resource: StudyResource): void {
      const current = get().resources;
      set({
        resources: current.map((r) => (r.id === resource.id ? { ...r, ...resource } : r)),
      });
      logger?.info(`Resource updated: ${resource.id}`);
    },

    removeResource(resourceId: string): void {
      const current = get().resources;
      set({
        resources: current.filter((r) => r.id !== resourceId),
      });
      logger?.info(`Resource removed: ${resourceId}`);
    },

    setError(error: string | null): void {
      set({ error });
    },
  }));
}
