import { useState, useCallback } from "react";
import { StudentSearchResult } from "@/types";
import profilesService from "@/lib/services/profiles.service";

interface UseSearchStudentsState {
  students: StudentSearchResult[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para buscar estudiantes por materia
 *
 * @returns {Object} Estado y métodos de búsqueda
 * @returns {StudentSearchResult[]} students - Lista de estudiantes encontrados
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} searchBySubject - Busca estudiantes por ID de materia
 * @returns {Function} clear - Limpia los resultados
 *
 * @example
 * const { students, searchBySubject, isLoading } = useSearchStudents();
 * await searchBySubject(subjectId);
 */
export default function useSearchStudents() {
  const [state, setState] = useState<UseSearchStudentsState>({
    students: [],
    isLoading: false,
    error: null,
  });

  const searchBySubject = useCallback(async (subjectId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await profilesService.searchStudents(subjectId);
      setState({ students: data, isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error buscando estudiantes";
      console.error("Error searching students:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const clear = useCallback(() => {
    setState({
      students: [],
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    students: state.students,
    isLoading: state.isLoading,
    error: state.error,
    searchBySubject,
    clear,
  };
}
