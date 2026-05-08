import { useCallback } from "react";
import { useNotificationStore } from "@/store/useNotificationStore";

/**
 * Hook para mostrar notificaciones del sistema
 *
 * @returns {Object} Métodos de notificación
 * @returns {Function} show - Muestra una notificación personalizada
 * @returns {Function} success - Muestra notificación de éxito
 * @returns {Function} error - Muestra notificación de error
 * @returns {Function} info - Muestra notificación de información
 * @returns {Function} warning - Muestra notificación de advertencia
 * @returns {Function} dismiss - Cierra una notificación
 * @returns {Function} clear - Limpia todas las notificaciones
 *
 * @example
 * const { success, error, info } = useNotifications();
 * success("Perfil actualizado correctamente");
 * error("Error al guardar cambios");
 * info("Cargando datos...");
 */
export default function useNotifications() {
  const { addNotification, removeNotification, clearNotifications } =
    useNotificationStore();

  const show = useCallback(
    (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      addNotification({ type, message });
    },
    [addNotification]
  );

  const success = useCallback(
    (message: string) => {
      show(message, "success");
    },
    [show]
  );

  const error = useCallback(
    (message: string) => {
      show(message, "error");
    },
    [show]
  );

  const info = useCallback(
    (message: string) => {
      show(message, "info");
    },
    [show]
  );

  const warning = useCallback(
    (message: string) => {
      show(message, "warning");
    },
    [show]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  const clear = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  return {
    show,
    success,
    error,
    info,
    warning,
    dismiss,
    clear,
  };
}
