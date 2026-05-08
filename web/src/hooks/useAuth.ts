import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import authService from "@/lib/services/auth.service";

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
  const { user, isLoading, isAuthenticated, login, logout, restoreSession } =
    useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await login(email, password);
      } catch (error) {
        console.error("Error en login:", error);
        throw error;
      }
    },
    [login]
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
      await restoreSession();
    } catch (error) {
      console.error("Error restaurando sesión:", error);
      // No relanzar error, solo registrar
    }
  }, [restoreSession]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    restoreSession: handleRestoreSession,
  };
}
