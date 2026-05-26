/**
 * Auth Store Factory
 * Creates Zustand auth store with dependency injection
 */
import type { AuthProfile } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";
export interface AuthState {
    user: AuthProfile | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
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
export declare function createAuthStore(deps: StoreDeps): import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState>, "setState" | "persist"> & {
    setState(partial: AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>), replace?: false | undefined): unknown;
    setState(state: AuthState | ((state: AuthState) => AuthState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState, {
            user: any;
            accessToken: any;
            refreshToken: any;
            isAuthenticated: any;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState, {
            user: any;
            accessToken: any;
            refreshToken: any;
            isAuthenticated: any;
        }, unknown>>;
    };
}>;
//# sourceMappingURL=createAuthStore.d.ts.map