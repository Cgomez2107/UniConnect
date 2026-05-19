import { useState, useCallback, useEffect } from "react";

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook genérico para manejar operaciones asincrónicas
 *
 * @template T - Tipo del dato que retorna la función asincrónica
 *
 * @param {Function} asyncFn - Función asincrónica a ejecutar
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoExecute - Ejecutar automáticamente al montar (default: false)
 * @param {any[]} options.dependencies - Dependencias para re-ejecutar (default: [])
 *
 * @returns {Object} Estado y métodos async
 * @returns {T|null} data - Datos retornados por la función
 * @returns {boolean} isLoading - Estado de carga
 * @returns {Error|null} error - Error si ocurrió
 * @returns {Function} execute - Ejecuta la función asincrónica
 * @returns {Function} reset - Reinicia el estado
 *
 * @example
 * const { data, isLoading, error, execute } = useAsync(
 *   async () => await fetchUsers(),
 *   { autoExecute: true }
 * );
 */
export default function useAsync<T>(
  asyncFn: () => Promise<T>,
  options = { autoExecute: false, dependencies: [] }
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await asyncFn();
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error in useAsync:", error);
      setState({ data: null, isLoading: false, error });
      throw error;
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  // Auto-ejecutar si se especifica
  useEffect(() => {
    if (options.autoExecute) {
      execute();
    }
  }, options.dependencies);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    execute,
    reset,
  };
}
