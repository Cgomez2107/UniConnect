import { useState, useCallback, useEffect } from "react";
import { StudyRequest } from "@/types";
import studyGroupsService from "@/lib/services/studyGroups.service";

interface UseFeedState {
  requests: StudyRequest[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar el feed de solicitudes de grupos de estudio
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar (default: true)
 *
 * @returns {Object} Estado y métodos del feed
 * @returns {StudyRequest[]} requests - Lista de solicitudes de grupos de estudio
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error si existe
 * @returns {Function} loadRequests - Carga las solicitudes
 * @returns {Function} refresh - Actualiza el feed
 *
 * @example
 * const { requests, isLoading, error, refresh } = useFeed();
 */
export default function useFeed(options = { autoLoad: true }) {
  const [state, setState] = useState<UseFeedState>({
    requests: [],
    isLoading: false,
    error: null,
  });

  const loadRequests = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await studyGroupsService.listStudyGroups();
      setState({ requests: data, isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando feed";
      console.error("Error loading feed:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    return loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (options.autoLoad) {
      loadRequests();
    }
  }, [options.autoLoad, loadRequests]);

  return {
    requests: state.requests,
    isLoading: state.isLoading,
    error: state.error,
    loadRequests,
    refresh,
  };
}
