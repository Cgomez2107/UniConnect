import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "uniconnect-event-subscriptions";

function loadFromLegacy(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return [];
}

interface EventSubscriptionState {
  subscribedCategories: string[];
  isSubscribed: (category: string) => boolean;
  toggle: (category: string) => void;
  subscribe: (category: string) => void;
  unsubscribe: (category: string) => void;
}

export const useEventSubscriptionStore = create<EventSubscriptionState>()(
  persist(
    (set, get) => ({
      subscribedCategories: (() => {
        const legacy = loadFromLegacy();
        if (legacy.length > 0) return legacy;
        return [];
      })(),

      isSubscribed: (category: string) => {
        return get().subscribedCategories.includes(category);
      },

      toggle: (category: string) => {
        set((state) => {
          const exists = state.subscribedCategories.includes(category);
          return {
            subscribedCategories: exists
              ? state.subscribedCategories.filter((c) => c !== category)
              : [...state.subscribedCategories, category],
          };
        });
      },

      subscribe: (category: string) => {
        set((state) => {
          if (state.subscribedCategories.includes(category)) return state;
          return {
            subscribedCategories: [...state.subscribedCategories, category],
          };
        });
      },

      unsubscribe: (category: string) => {
        set((state) => ({
          subscribedCategories: state.subscribedCategories.filter(
            (c) => c !== category,
          ),
        }));
      },
    }),
    {
      name: "event-subscriptions",
      partialize: (state) => ({
        subscribedCategories: state.subscribedCategories,
      }),
    },
  ),
);
