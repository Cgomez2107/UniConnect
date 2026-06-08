import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SpamState {
  isBlocked: boolean;
  blockUntil: number | null; // Timestamp ms
  remainingTime: number; // in seconds
  setBlocked: (durationMs: number) => void;
  clearBlock: () => void;
  checkBlockStatus: () => void;
}

export const useSpamStore = create<SpamState>()(
  persist(
    (set, get) => ({
      isBlocked: false,
      blockUntil: null,
      remainingTime: 0,
      setBlocked: (durationMs: number) => {
        const until = Date.now() + durationMs;
        console.log("[useSpamStore] setBlocked llamado con durationMs:", durationMs, "until:", until);
        set({
          isBlocked: true,
          blockUntil: until,
          remainingTime: Math.max(0, Math.ceil(durationMs / 1000)),
        });
        console.log("[useSpamStore] Estado después de setBlocked:", {
          isBlocked: true,
          blockUntil: until,
          remainingTime: Math.max(0, Math.ceil(durationMs / 1000)),
        });
      },
      clearBlock: () => {
        set({
          isBlocked: false,
          blockUntil: null,
          remainingTime: 0,
        });
      },
      checkBlockStatus: () => {
        const { blockUntil } = get();
        if (!blockUntil) {
          if (get().isBlocked) {
            set({ isBlocked: false, blockUntil: null, remainingTime: 0 });
          }
          return;
        }
        const now = Date.now();
        if (now >= blockUntil) {
          set({
            isBlocked: false,
            blockUntil: null,
            remainingTime: 0,
          });
        } else {
          set({
            isBlocked: true,
            remainingTime: Math.ceil((blockUntil - now) / 1000),
          });
        }
      },
    }),
    {
      name: "spam-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isBlocked: state.isBlocked,
        blockUntil: state.blockUntil,
      }),
    }
  )
);
