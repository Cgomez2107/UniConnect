import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Conversation } from "@/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ConversationsStoreState {
  conversations: Conversation[];
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setConversations: (conversations: Conversation[]) => void;
  clearConversations: () => void;
}

export const useConversationsStore = create<ConversationsStoreState>()(
  persist(
    (set) => ({
      conversations: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
      setConversations: (conversations: Conversation[]) => set({ conversations }),
      clearConversations: () => set({ conversations: [] }),
    }),
    {
      name: "conversations-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ conversations: state.conversations }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[useConversationsStore] Error during hydration", error);
        }

        state?.setHasHydrated(true);
      },
    },
  ),
);
