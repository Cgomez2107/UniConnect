import { useState, useCallback } from "react";
import adminService from "@/lib/services/admin.service";

interface UseAdminState {
  users: any[];
  requests: any[];
  resources: any[];
  events: any[];
  metrics: any;
  loading: boolean;
  error: string | null;
}

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
