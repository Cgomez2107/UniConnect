import { useCallback } from "react";
export function useAuth(deps) {
    const { user, isLoading, isAuthenticated, signIn, logout, getCurrentUser, hydrate } = deps.useAuthStore();
    const login = useCallback(async (email, password) => {
        try {
            await signIn(email, password);
        }
        catch (error) {
            console.error("Error en login:", error);
            throw error;
        }
    }, [signIn]);
    const handleLogout = useCallback(async () => {
        try {
            await logout();
        }
        catch (error) {
            console.error("Error en logout:", error);
            throw error;
        }
    }, [logout]);
    const restoreSession = useCallback(async () => {
        try {
            await hydrate?.();
            await getCurrentUser();
        }
        catch (error) {
            console.error("Error restaurando sesión:", error);
        }
    }, [hydrate, getCurrentUser]);
    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout: handleLogout,
        restoreSession,
    };
}
//# sourceMappingURL=useAuth.js.map