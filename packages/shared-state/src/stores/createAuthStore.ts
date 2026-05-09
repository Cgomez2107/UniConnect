/**
 * Auth Store Factory
 * Creates Zustand auth store with dependency injection
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthProfile, SessionData } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";

export interface AuthState {
  // State
  user: AuthProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, firstName: string, lastName: string): Promise<void>;
  getCurrentUser(): Promise<void>;
  refreshAccessToken(): Promise<void>;
  logout(): Promise<void>;
  setError(error: string | null): void;
  hydrate(): Promise<void>;
}

/**
 * Factory function - creates a new auth store instance
 * Enables dependency injection and multiple store instances (useful for testing)
 */
export function createAuthStore(deps: StoreDeps) {
  const { apiClients, storage, logger } = deps;
  const AUTH_SESSION_KEY = "uniconnect-auth-session";

  return create<AuthState>()(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,

        // Sign in with email and password
        async signIn(email: string, password: string): Promise<void> {
          try {
            set({ isLoading: true, error: null });
            logger?.info(`Signing in user: ${email}`);

            const response = await apiClients.auth.signIn({ email, password });

            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            logger?.info("Sign in successful");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Sign in failed";
            set({ error: errorMessage, isLoading: false });
            logger?.error(`Sign in error: ${errorMessage}`);
            throw error;
          }
        },

        // Sign up with email and password
        async signUp(
          email: string,
          password: string,
          firstName: string,
          lastName: string
        ): Promise<void> {
          try {
            set({ isLoading: true, error: null });
            logger?.info(`Signing up user: ${email}`);

            const response = await apiClients.auth.signUp({
              email,
              password,
              firstName,
              lastName,
            });

            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            logger?.info("Sign up successful");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Sign up failed";
            set({ error: errorMessage, isLoading: false });
            logger?.error(`Sign up error: ${errorMessage}`);
            throw error;
          }
        },

        // Get current user
        async getCurrentUser(): Promise<void> {
          try {
            set({ isLoading: true });
            logger?.info("Fetching current user");

            const user = await apiClients.auth.getCurrentUser();

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch user";
            set({ error: errorMessage, isLoading: false });
            logger?.error(`Get current user error: ${errorMessage}`);
            throw error;
          }
        },

        // Refresh access token
        async refreshAccessToken(): Promise<void> {
          try {
            const { refreshToken } = get();

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            logger?.info("Refreshing access token");

            const response = await apiClients.auth.refreshToken(refreshToken);

            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              error: null,
            });

            logger?.info("Access token refreshed");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Token refresh failed";
            set({ error: errorMessage, isAuthenticated: false });
            logger?.error(`Token refresh error: ${errorMessage}`);
            throw error;
          }
        },

        // Logout
        async logout(): Promise<void> {
          try {
            logger?.info("Logging out");

            await apiClients.auth.signOut();

            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: null,
            });

            logger?.info("Logout successful");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Logout failed";
            logger?.error(`Logout error: ${errorMessage}`);
            // Still clear local state even if API call fails
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
        },

        // Set error manually
        setError(error: string | null): void {
          set({ error });
        },

        // Hydrate from persistent storage
        async hydrate(): Promise<void> {
          try {
            const storedSession = await storage.getItem(AUTH_SESSION_KEY);

            if (storedSession) {
              const parsed = JSON.parse(storedSession) as
                | SessionData
                | { state?: Partial<AuthState> };
              const session = (parsed as { state?: Partial<AuthState> }).state ?? parsed;

              set({
                user: (session as Partial<AuthState>).user ?? null,
                accessToken: (session as Partial<AuthState>).accessToken ?? null,
                refreshToken: (session as Partial<AuthState>).refreshToken ?? null,
                isAuthenticated: Boolean((session as Partial<AuthState>).accessToken),
              });
              logger?.info("Auth state hydrated from storage");
            }
          } catch (error) {
            logger?.error("Error hydrating auth state:", error);
          }
        },
      }),
      {
        name: AUTH_SESSION_KEY,
        storage: {
          getItem: async (name) => {
            const item = await storage.getItem(name);
            return item ? JSON.parse(item) : null;
          },
          setItem: async (name, value) => {
            await storage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await storage.removeItem(name);
          },
        },
        // Only persist user, tokens; not loading/error states
        partialize: (state: any) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  );
}
