import { create } from "zustand";
import type { StoreDeps } from "../types/index.js";

export interface UnreadCountState {
  conversationUnreadCounts: Record<string, number>;
  totalUnread: number;

  setConversationUnread(conversationId: string, count: number): void;
  incrementUnread(conversationId: string): void;
  decrementUnread(conversationId: string): void;
  clearConversationUnread(conversationId: string): void;
  recalculateTotal(): void;
}

export function createUnreadCountStore(deps: Pick<StoreDeps, "logger">) {
  const { logger } = deps;

  return create<UnreadCountState>()((set, get) => ({
    conversationUnreadCounts: {},
    totalUnread: 0,

    setConversationUnread(conversationId: string, count: number): void {
      set((state) => {
        const updated = { ...state.conversationUnreadCounts, [conversationId]: count };
        const total = Object.values(updated).reduce((a, b) => a + b, 0);
        return { conversationUnreadCounts: updated, totalUnread: total };
      });
      logger?.info(`Unread count set for ${conversationId}: ${count}`);
    },

    incrementUnread(conversationId: string): void {
      set((state) => {
        const current = state.conversationUnreadCounts[conversationId] || 0;
        const updated = { ...state.conversationUnreadCounts, [conversationId]: current + 1 };
        const total = Object.values(updated).reduce((a, b) => a + b, 0);
        return { conversationUnreadCounts: updated, totalUnread: total };
      });
    },

    decrementUnread(conversationId: string): void {
      set((state) => {
        const current = state.conversationUnreadCounts[conversationId] || 0;
        if (current <= 0) return state;
        const updated = { ...state.conversationUnreadCounts, [conversationId]: current - 1 };
        const total = Object.values(updated).reduce((a, b) => a + b, 0);
        return { conversationUnreadCounts: updated, totalUnread: total };
      });
    },

    clearConversationUnread(conversationId: string): void {
      set((state) => {
        const updated = { ...state.conversationUnreadCounts };
        delete updated[conversationId];
        const total = Object.values(updated).reduce((a, b) => a + b, 0);
        return { conversationUnreadCounts: updated, totalUnread: total };
      });
      logger?.info(`Unread cleared for ${conversationId}`);
    },

    recalculateTotal(): void {
      set((state) => ({
        totalUnread: Object.values(state.conversationUnreadCounts).reduce((a, b) => a + b, 0),
      }));
    },
  }));
}
