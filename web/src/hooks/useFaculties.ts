import { useState, useCallback } from "react";
import { Faculty, Program, Subject } from "@/types";
import { apiClient } from "@/lib/api/client";

interface UseFacultiesState {
  faculties: Faculty[];
  programs: Program[];
  subjects: Subject[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar el catálogo académico (facultades, programas, materias)
 *
 * @returns {Object} Estado y métodos del catálogo
 * @returns {Faculty[]} faculties - Lista de facultades
 * @returns {Program[]} programs - Lista de programas
 * @returns {Subject[]} subjects - Lista de materias
 * @returns {boolean} loading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} loadFaculties - Carga las facultades
 * @returns {Function} loadProgramsByFaculty - Carga programas de una facultad
 * @returns {Function} loadSubjects - Carga materias de un programa
 * @returns {Function} clear - Limpia el estado
 *
 * @example
 * const { faculties, loadFaculties, loadProgramsByFaculty } = useFaculties();
 * await loadFaculties();
 * await loadProgramsByFaculty(facultyId);
 */
export default function useFaculties() {
  const [state, setState] = useState<UseFacultiesState>({
    faculties: [],
    programs: [],
    subjects: [],
    loading: false,
    error: null,
  });

  const loadFaculties = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get<{ data: Faculty[] }>(
        "/api/v1/catalog/faculties"
      );
      setState((prev) => ({
        ...prev,
        faculties: response.data.data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando facultades";
      console.error("Error loading faculties:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const loadProgramsByFaculty = useCallback(async (facultyId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get<{ data: Program[] }>(
        `/api/v1/catalog/faculties/${facultyId}/programs`
      );
      setState((prev) => ({
        ...prev,
        programs: response.data.data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando programas";
      console.error("Error loading programs:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const loadSubjects = useCallback(async (programId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get<{ data: Subject[] }>(
        `/api/v1/catalog/programs/${programId}/subjects`
      );
      setState((prev) => ({
        ...prev,
        subjects: response.data.data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando materias";
      console.error("Error loading subjects:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const clear = useCallback(() => {
    setState({
      faculties: [],
      programs: [],
      subjects: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    faculties: state.faculties,
    programs: state.programs,
    subjects: state.subjects,
    loading: state.loading,
    error: state.error,
    loadFaculties,
    loadProgramsByFaculty,
    loadSubjects,
    clear,
  };
}
