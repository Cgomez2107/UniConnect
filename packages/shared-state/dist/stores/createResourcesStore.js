import { create } from "zustand";
export function createResourcesStore(deps) {
    const { apiClients, logger } = deps;
    return create()((set, get) => ({
        resources: [],
        isLoading: false,
        error: null,
        async loadResources(filters) {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load resources";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Load resources error: ${errorMessage}`);
                throw error;
            }
        },
        setResources(resources) {
            set({ resources });
            logger?.info(`Resources set: ${resources.length}`);
        },
        addResource(resource) {
            const current = get().resources;
            if (current.some((r) => r.id === resource.id))
                return;
            set({ resources: [...current, resource] });
            logger?.info(`Resource added: ${resource.id}`);
        },
        updateResource(resource) {
            const current = get().resources;
            set({
                resources: current.map((r) => (r.id === resource.id ? { ...r, ...resource } : r)),
            });
            logger?.info(`Resource updated: ${resource.id}`);
        },
        removeResource(resourceId) {
            const current = get().resources;
            set({
                resources: current.filter((r) => r.id !== resourceId),
            });
            logger?.info(`Resource removed: ${resourceId}`);
        },
        setError(error) {
            set({ error });
        },
    }));
}
//# sourceMappingURL=createResourcesStore.js.map