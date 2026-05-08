import { create } from "zustand";
import { apiClient } from "../lib/api/client";
import { UserSessionUI } from "@/types/ui";
import { mapAuthUserApiToUI } from "@/utils/mappers";

interface AuthState {
  user: UserSessionUI | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserSessionUI | null) => void;
  restoreSession: () => Promise<void>;
}

const clearStoredSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("preOAuthLocation");

  Object.keys(localStorage)
    .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
    .forEach((key) => localStorage.removeItem(key));
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post("/auth/signin", {
        email,
        password,
      });

      const { user, access_token } = response.data;

      if (access_token) {
        localStorage.setItem("accessToken", access_token);
      }

      const userSession = mapAuthUserApiToUI(user);

      set({ user: userSession, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    clearStoredSession();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await apiClient.get("/auth/session");
      const user = response.data;

      const userSession = mapAuthUserApiToUI(user);

      set({ user: userSession, isAuthenticated: true });
    } catch (error) {
      console.error("Failed to restore session:", error);
      clearStoredSession();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
