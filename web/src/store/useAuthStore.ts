import { create } from "zustand";
import { apiClient } from "../lib/httpClient";

export type UserRole = "estudiante" | "admin";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
}

interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserSession | null) => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      const { user, access_token } = response.data;

      if (access_token) {
        localStorage.setItem("accessToken", access_token);
      }

      const userSession: UserSession = {
        id: user.id,
        email: user.email,
        fullName: user.full_name || "Estudiante",
        avatarUrl: user.avatar_url,
        role: user.role === "admin" ? "admin" : "estudiante",
      };

      set({ user: userSession, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      const user = response.data;

      const userSession: UserSession = {
        id: user.id,
        email: user.email,
        fullName: user.full_name || "Estudiante",
        avatarUrl: user.avatar_url,
        role: user.role === "admin" ? "admin" : "estudiante",
      };

      set({ user: userSession, isAuthenticated: true });
    } catch (error) {
      console.error("Failed to restore session:", error);
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false });
    }
  },
}));
