import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

/**
 * Storage adapter compatible with Zustand persist that is safe for
 * Expo Web static rendering (SSR-like) and React Native runtime.
 */
export const zustandPlatformStorage: StateStorage = {
  getItem: async (name) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return null;
      }

      return window.localStorage.getItem(name);
    }

    return AsyncStorage.getItem(name);
  },

  setItem: async (name, value) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(name, value);
      return;
    }

    await AsyncStorage.setItem(name, value);
  },

  removeItem: async (name) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.removeItem(name);
      return;
    }

    await AsyncStorage.removeItem(name);
  },
};
