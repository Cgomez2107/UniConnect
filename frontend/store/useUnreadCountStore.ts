import { create } from "zustand";
import { DIContainer } from "@/lib/services/di/container";

export interface UnreadState {
  totalUnreadCount: number;
  setTotalUnreadCount: (count: number) => void;
  incrementUnreadCount: (amount: number) => void;
  decrementUnreadCount: (amount: number) => void;
  refreshUnreadCount: () => Promise<void>;
  reset: () => void;
}

export const useUnreadCountStore = create<UnreadState>((set) => ({
  totalUnreadCount: 0,

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
    const container = DIContainer.getInstance();
    const getTotalUnreadCount = container.getGetTotalUnreadCount();
    const count = await getTotalUnreadCount.execute();
    set({ totalUnreadCount: Math.max(0, count) });
  },

  reset: () => set({ totalUnreadCount: 0 }),
}));
