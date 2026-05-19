import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { mapAuthUserApiToUI } from "@/utils/mappers";

export default function useAuth() {
  const { user, isLoading, isAuthenticated, signIn, logout, getCurrentUser, hydrate } = useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await signIn(email, password);
      } catch (error) {
        console.error("Error en login:", error);
        throw error;
      }
    },
    [signIn]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem("accessToken");
    } catch (error) {
      console.error("Error en logout:", error);
      throw error;
    }
  }, [logout]);

  const handleRestoreSession = useCallback(async () => {
    try {
      await hydrate?.();
      await getCurrentUser();
    } catch (error) {
      console.error("Error restaurando sesión:", error);
    }
  }, [hydrate, getCurrentUser]);

  const userUI = useMemo(
    () => (user ? mapAuthUserApiToUI(user as any) : null),
    [user]
  );

  return {
    user: userUI,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    restoreSession: handleRestoreSession,
  };
}
