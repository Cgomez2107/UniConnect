import { create } from "zustand";
export function createUnreadCountStore(deps) {
    const { logger } = deps;
    return create()((set, get) => ({
        conversationUnreadCounts: {},
        totalUnread: 0,
        setConversationUnread(conversationId, count) {
            set((state) => {
                const updated = { ...state.conversationUnreadCounts, [conversationId]: count };
                const total = Object.values(updated).reduce((a, b) => a + b, 0);
                return { conversationUnreadCounts: updated, totalUnread: total };
            });
            logger?.info(`Unread count set for ${conversationId}: ${count}`);
        },
        incrementUnread(conversationId) {
            set((state) => {
                const current = state.conversationUnreadCounts[conversationId] || 0;
                const updated = { ...state.conversationUnreadCounts, [conversationId]: current + 1 };
                const total = Object.values(updated).reduce((a, b) => a + b, 0);
                return { conversationUnreadCounts: updated, totalUnread: total };
            });
        },
        decrementUnread(conversationId) {
            set((state) => {
                const current = state.conversationUnreadCounts[conversationId] || 0;
                if (current <= 0)
                    return state;
                const updated = { ...state.conversationUnreadCounts, [conversationId]: current - 1 };
                const total = Object.values(updated).reduce((a, b) => a + b, 0);
                return { conversationUnreadCounts: updated, totalUnread: total };
            });
        },
        clearConversationUnread(conversationId) {
            set((state) => {
                const updated = { ...state.conversationUnreadCounts };
                delete updated[conversationId];
                const total = Object.values(updated).reduce((a, b) => a + b, 0);
                return { conversationUnreadCounts: updated, totalUnread: total };
            });
            logger?.info(`Unread cleared for ${conversationId}`);
        },
        recalculateTotal() {
            set((state) => ({
                totalUnread: Object.values(state.conversationUnreadCounts).reduce((a, b) => a + b, 0),
            }));
        },
    }));
}
//# sourceMappingURL=createUnreadCountStore.js.map