import type { AuthState } from "@uniconnect/shared-state";
import type { AuthProfile } from "@uniconnect/shared-types";
export interface UseAuthDeps {
    useAuthStore: () => AuthState;
}
export interface UseAuthResult {
    user: AuthProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
}
export declare function useAuth(deps: UseAuthDeps): UseAuthResult;
//# sourceMappingURL=useAuth.d.ts.map