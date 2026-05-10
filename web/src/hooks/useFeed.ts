import { useState, useCallback, useEffect } from "react";
import { Application } from "@/types";
import { StudyRequestUI } from "@/types/ui";
import studyGroupsService from "@/lib/services/studyGroups.service";
import { mapStudyRequestApiToUI } from "@/utils/mappers";

interface UseFeedState {
  requests: StudyRequestUI[];
  applications: Application[];
  isLoading: boolean;
  error: string | null;
}

interface UseFeedOptions {
  autoLoad?: boolean;
  userId?: string;
}

/**
 * Hook para gestionar el feed de solicitudes de grupos de estudio
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar (default: true)
 * @param {string} options.userId - ID del usuario para obtener sus aplicaciones
 *
 * @returns {Object} Estado y métodos del feed
 * @returns {StudyRequestUI[]} requests - Lista de solicitudes mapeadas a camelCase
 * @returns {Application[]} applications - Aplicaciones del usuario autenticado
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error si existe
 * @returns {Function} loadRequests - Carga las solicitudes
 * @returns {Function} refresh - Actualiza el feed
 *
 * @example
 * const { requests, applications, isLoading, error, refresh } = useFeed({ userId: user.id });
 */
export default function useFeed(options: UseFeedOptions = { autoLoad: true }) {
  const { autoLoad = true, userId } = options;
  const [state, setState] = useState<UseFeedState>({
    requests: [],
    applications: [],
    isLoading: false,
    error: null,
  });

  const loadRequests = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [data, apps] = await Promise.all([
        studyGroupsService.listStudyGroups(),
        userId ? studyGroupsService.listMyApplications() : Promise.resolve([]),
      ]);
      const mapped = data.map(mapStudyRequestApiToUI);
      setState({ requests: mapped, applications: apps, isLoading: false, error: null });
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
  }, [userId]);

  const refresh = useCallback(() => {
    return loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (autoLoad) {
      loadRequests();
    }
  }, [autoLoad, loadRequests]);

  return {
    requests: state.requests,
    applications: state.applications,
    isLoading: state.isLoading,
    error: state.error,
    loadRequests,
    refresh,
  };
}
