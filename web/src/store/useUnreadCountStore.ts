import { create } from "zustand";

interface UnreadCountStore {
  conversationUnreadCounts: Record<string, number>;
  totalUnread: number;

  setConversationUnread: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  decrementUnread: (conversationId: string) => void;
  clearConversationUnread: (conversationId: string) => void;
  recalculateTotal: () => void;
}

export const useUnreadCountStore = create<UnreadCountStore>((set, get) => ({
  conversationUnreadCounts: {},
  totalUnread: 0,

  setConversationUnread: (conversationId, count) =>
    set((state) => {
      const updated = { ...state.conversationUnreadCounts, [conversationId]: count };
      const total = Object.values(updated).reduce((a, b) => a + b, 0);
      return {
        conversationUnreadCounts: updated,
        totalUnread: total,
      };
    }),

  incrementUnread: (conversationId) =>
    set((state) => {
      const current = state.conversationUnreadCounts[conversationId] || 0;
      const updated = { ...state.conversationUnreadCounts, [conversationId]: current + 1 };
      const total = Object.values(updated).reduce((a, b) => a + b, 0);
      return {
        conversationUnreadCounts: updated,
        totalUnread: total,
      };
    }),

  decrementUnread: (conversationId) =>
    set((state) => {
      const current = state.conversationUnreadCounts[conversationId] || 0;
      if (current <= 0) return state;
      const updated = { ...state.conversationUnreadCounts, [conversationId]: current - 1 };
      const total = Object.values(updated).reduce((a, b) => a + b, 0);
      return {
        conversationUnreadCounts: updated,
        totalUnread: total,
      };
    }),

  clearConversationUnread: (conversationId) =>
    set((state) => {
      const updated = { ...state.conversationUnreadCounts };
      delete updated[conversationId];
      const total = Object.values(updated).reduce((a, b) => a + b, 0);
      return {
        conversationUnreadCounts: updated,
        totalUnread: total,
      };
    }),

  recalculateTotal: () =>
    set((state) => ({
      totalUnread: Object.values(state.conversationUnreadCounts).reduce((a, b) => a + b, 0),
    })),
}));

export default useUnreadCountStore;
