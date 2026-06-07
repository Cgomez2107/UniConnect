import { create } from "zustand";
export function createStudyGroupsStore(deps) {
    const { apiClients, logger } = deps;
    return create()((set, get) => ({
        groups: [],
        isLoading: false,
        error: null,
        async loadGroups() {
            try {
                set({ isLoading: true, error: null });
                logger?.info("Loading study groups");
                // Use injected client or fallback
                const client = apiClients.studyGroups;
                if (!client) {
                    throw new Error("studyGroups API client not provided");
                }
                const groups = await client.list();
                set({ groups, isLoading: false });
                logger?.info(`Loaded ${groups.length} study groups`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load study groups";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Load study groups error: ${errorMessage}`);
                throw error;
            }
        },
        setGroups(groups) {
            set({ groups });
            logger?.info(`Study groups set: ${groups.length}`);
        },
        addGroup(group) {
            const current = get().groups;
            if (current.some((g) => g.id === group.id))
                return;
            set({ groups: [...current, group] });
            logger?.info(`Study group added: ${group.id}`);
        },
        updateGroup(group) {
            const current = get().groups;
            set({
                groups: current.map((g) => (g.id === group.id ? { ...g, ...group } : g)),
            });
            logger?.info(`Study group updated: ${group.id}`);
        },
        removeGroup(groupId) {
            const current = get().groups;
            set({
                groups: current.filter((g) => g.id !== groupId),
            });
            logger?.info(`Study group removed: ${groupId}`);
        },
        setError(error) {
            set({ error });
        },
    }));
}
//# sourceMappingURL=createStudyGroupsStore.js.map