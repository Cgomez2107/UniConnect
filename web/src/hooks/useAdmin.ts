import { useState, useCallback } from "react";
import adminService from "@/lib/services/admin.service";
import { AdminUserUI } from "@/types/ui";
import { AdminRequest, AdminMetrics } from "@/types";

interface UseAdminState {
  users: AdminUserUI[];
  requests: AdminRequest[];
  resources: any[];
  events: any[];
  metrics: AdminMetrics | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para operaciones administrativas
 *
 * @returns {Object} Estado y métodos admin
 * @returns {Profile[]} users - Lista de usuarios
 * @returns {any[]} requests - Solicitudes de grupos de estudio
 * @returns {any[]} resources - Recursos del sistema
 * @returns {any[]} events - Eventos
 * @returns {AdminMetrics|null} metrics - Métricas del sistema
 * @returns {boolean} loading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} getUsers - Obtiene lista de usuarios
 * @returns {Function} getRequests - Obtiene solicitudes
 * @returns {Function} getMetrics - Obtiene métricas
 *
 * @example
 * const { users, metrics, getUsers, getMetrics } = useAdmin();
 * await getUsers();
 * await getMetrics();
 */
export default function useAdmin() {
  const [state, setState] = useState<UseAdminState>({
    users: [],
    requests: [],
    resources: [],
    events: [],
    metrics: null,
    loading: false,
    error: null,
  });

  const getUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await adminService.getUsers();
      setState((prev) => ({
        ...prev,
        users: data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando usuarios";
      console.error("Error getting users:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const getRequests = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await adminService.getRequests();
      setState((prev) => ({
        ...prev,
        requests: data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando solicitudes";
      console.error("Error getting requests:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const getMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await adminService.getMetrics();
      setState((prev) => ({
        ...prev,
        metrics: data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando métricas";
      console.error("Error getting metrics:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([getUsers(), getRequests(), getMetrics()]);
  }, [getUsers, getRequests, getMetrics]);

  return {
    users: state.users,
    requests: state.requests,
    resources: state.resources,
    events: state.events,
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    getUsers,
    getRequests,
    getMetrics,
    refresh,
  };
}
