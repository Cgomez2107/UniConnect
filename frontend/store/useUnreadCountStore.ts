import { create } from "zustand";
import type { GetTotalUnreadCount } from "@/lib/services/domain/use-cases/messaging/GetTotalUnreadCount";

export interface UnreadState {
  totalUnreadCount: number;
  isRefreshing: boolean;
  lastRefreshAt: number;
  setTotalUnreadCount: (count: number) => void;
  incrementUnreadCount: (amount: number) => void;
  decrementUnreadCount: (amount: number) => void;
  refreshUnreadCount: () => Promise<void>;
  reset: () => void;
}

const MIN_REFRESH_INTERVAL_MS = 100;

export const createUnreadCountStore = (getTotalUnreadCount: GetTotalUnreadCount) =>
  create<UnreadState>((set, get) => ({
    totalUnreadCount: 0,
    isRefreshing: false,
    lastRefreshAt: 0,

    setTotalUnreadCount: (count: number) =>
      set({ totalUnreadCount: Math.max(0, count) }),

    incrementUnreadCount: (amount: number) =>
      set((state) => ({
        totalUnreadCount: Math.max(0, state.totalUnreadCount + amount),
      })),

    decrementUnreadCount: (amount: number) =>
      set((state) => ({
        totalUnreadCount: Math.max(0, state.totalUnreadCount - amount),
      })),

    refreshUnreadCount: async () => {
      const { isRefreshing, lastRefreshAt } = get();
      const now = Date.now();
      if (isRefreshing) return;
      if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return;

      set({ isRefreshing: true, lastRefreshAt: now });

      try {
        const count = await getTotalUnreadCount.execute();
        set({ totalUnreadCount: Math.max(0, count) });
      } finally {
        set({ isRefreshing: false, lastRefreshAt: Date.now() });
      }
    },

    reset: () => set({ totalUnreadCount: 0, isRefreshing: false, lastRefreshAt: 0 }),
  }));
