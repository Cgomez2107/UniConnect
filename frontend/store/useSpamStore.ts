import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ModerationErrorCode } from "@uniconnect/shared-types";

interface SpamState {
  isBlocked: boolean;
  blockUntil: number | null;
  remainingTime: number;
  blockReason: ModerationErrorCode | null;
  setBlocked: (durationMs: number, errorCode?: ModerationErrorCode) => void;
  clearBlock: () => void;
  checkBlockStatus: () => void;
}

export const useSpamStore = create<SpamState>()(
  persist(
    (set, get) => ({
      isBlocked: false,
      blockUntil: null,
      remainingTime: 0,
      blockReason: null,
      setBlocked: (durationMs: number, errorCode?: ModerationErrorCode) => {
        const until = Date.now() + durationMs;
        set({
          isBlocked: true,
          blockUntil: until,
          remainingTime: Math.max(0, Math.ceil(durationMs / 1000)),
          blockReason: errorCode ?? "MO_003",
        });
      },
      clearBlock: () => {
        set({
          isBlocked: false,
          blockUntil: null,
          remainingTime: 0,
          blockReason: null,
        });
      },
      checkBlockStatus: () => {
        const { blockUntil } = get();
        if (!blockUntil) {
          if (get().isBlocked) {
            set({ isBlocked: false, blockUntil: null, remainingTime: 0, blockReason: null });
          }
          return;
        }
        const now = Date.now();
        if (now >= blockUntil) {
          set({
            isBlocked: false,
            blockUntil: null,
            remainingTime: 0,
            blockReason: null,
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isBlocked: state.isBlocked,
        blockUntil: state.blockUntil,
        blockReason: state.blockReason,
      }),
    }
  )
);
