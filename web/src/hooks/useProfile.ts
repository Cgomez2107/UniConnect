import { useState, useCallback, useEffect } from "react";
import { Profile, EditProfileFormData } from "@/types";
import profilesService from "@/lib/services/profiles.service";

interface UseProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar el perfil del usuario actual
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar (default: true)
 *
 * @returns {Object} Estado y métodos del perfil
 * @returns {Profile|null} profile - Perfil del usuario
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} updateProfile - Actualiza el perfil
 * @returns {Function} refresh - Recarga el perfil
 *
 * @example
 * const { profile, updateProfile, refresh } = useProfile();
 * await updateProfile({ full_name: "Juan Pérez" });
 */
export default function useProfile(options = { autoLoad: true }) {
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  const loadProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await profilesService.getProfile();
      setState({ profile: data, isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando perfil";
      console.error("Error loading profile:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const updateProfile = useCallback(
    async (data: EditProfileFormData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const updated = await profilesService.updateProfile(data);
        setState({ profile: updated, isLoading: false, error: null });
        return updated;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error actualizando perfil";
        console.error("Error updating profile:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(() => {
    return loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (options.autoLoad) {
      loadProfile();
    }
  }, [options.autoLoad, loadProfile]);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    updateProfile,
    refresh,
  };
}
