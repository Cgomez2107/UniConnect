/**
 * Auth Store Factory
 * Creates Zustand auth store with dependency injection
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
/**
 * Factory function - creates a new auth store instance
 * Enables dependency injection and multiple store instances (useful for testing)
 */
export function createAuthStore(deps) {
    const { apiClients, storage, logger } = deps;
    const AUTH_SESSION_KEY = "uniconnect-auth-session";
    return create()(persist((set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        // Sign in with email and password
        async signIn(email, password) {
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
                deps.onSessionCreated?.({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
                logger?.info("Sign in successful");
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Sign in failed";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Sign in error: ${errorMessage}`);
                throw error;
            }
        },
        // Sign up with email and password
        async signUp(email, password, firstName, lastName) {
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
                deps.onSessionCreated?.({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
                logger?.info("Sign up successful");
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Sign up failed";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Sign up error: ${errorMessage}`);
                throw error;
            }
        },
        // Get current user
        async getCurrentUser() {
            try {
                set({ isLoading: true });
                logger?.info("Fetching current user");
                const user = await apiClients.auth.getCurrentUser();
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to fetch user";
                set({ error: errorMessage, isLoading: false });
                logger?.error(`Get current user error: ${errorMessage}`);
                throw error;
            }
        },
        // Refresh access token
        async refreshAccessToken() {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Token refresh failed";
                set({ error: errorMessage, isAuthenticated: false });
                logger?.error(`Token refresh error: ${errorMessage}`);
                throw error;
            }
        },
        // Logout
        async logout() {
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
            }
            catch (error) {
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
        setError(error) {
            set({ error });
        },
        // Hydrate from persistent storage
        async hydrate() {
            try {
                const storedSession = await storage.getItem(AUTH_SESSION_KEY);
                if (storedSession) {
                    const parsed = JSON.parse(storedSession);
                    const session = parsed.state ?? parsed;
                    set({
                        user: session.user ?? null,
                        accessToken: session.accessToken ?? null,
                        refreshToken: session.refreshToken ?? null,
                        isAuthenticated: Boolean(session.accessToken),
                    });
                    logger?.info("Auth state hydrated from storage");
                }
            }
            catch (error) {
                logger?.error("Error hydrating auth state:", error);
            }
        },
    }), {
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
        partialize: (state) => ({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated,
        }),
    }));
}
//# sourceMappingURL=createAuthStore.js.map