import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { mapAuthUserApiToUI } from "@/utils/mappers";

/**
 * Hook para gestionar la autenticación del usuario
 *
 * @returns {Object} Estado y métodos de autenticación
 * @returns {UserSession|null} user - Usuario autenticado
 * @returns {boolean} isAuthenticated - Estado de autenticación
 * @returns {boolean} isLoading - Estado de carga
 * @returns {Function} login - Inicia sesión con email y contraseña
 * @returns {Function} logout - Cierra la sesión del usuario
 * @returns {Function} restoreSession - Restaura la sesión si existe token
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 * await login("user@example.com", "password");
 */
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
      // hydrate() / getCurrentUser from shared store
      await hydrate?.();
      // optionally fetch current user
      await getCurrentUser();
    } catch (error) {
      console.error("Error restaurando sesión:", error);
    }
  }, [hydrate, getCurrentUser]);

  // Map domain user (from shared-state) to UI shape
  const userUI = user ? mapAuthUserApiToUI(user as any) : null;

  return {
    user: userUI,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    restoreSession: handleRestoreSession,
  };
}
