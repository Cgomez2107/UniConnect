/**
 * lib/api/errorHandler.ts
 * Interceptor que traduce errores del backend en mensajes visibles (Toast/Alert)
 * basado en el patrón State y sus transiciones.
 */

import { Alert } from "react-native";

export type ErrorType =
  | "GROUP_FULL"
  | "INVALID_TRANSITION"
  | "ADMIN_TRANSFER_PENDING"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

interface ErrorMessage {
  title: string;
  message: string;
  type: "error" | "warning" | "info";
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Mapea mensajes de error del backend a tipos conocidos
 */
export function parseBackendError(error: unknown): ErrorType {
  if (!(error instanceof Error)) {
    return "UNKNOWN";
  }

  const msg = error.message.toLowerCase();

  // Errores del patrón State
  if (msg.includes("full") || msg.includes("capacity") || msg.includes("llena")) {
    return "GROUP_FULL";
  }
  if (msg.includes("invalid") || msg.includes("transition") || msg.includes("no permitida")) {
    return "INVALID_TRANSITION";
  }
  if (msg.includes("transfer") || msg.includes("transferenciaпendiente")) {
    return "ADMIN_TRANSFER_PENDING";
  }

  // Errores HTTP generales
  if (msg.includes("401") || msg.includes("unauthorized")) {
    return "UNAUTHORIZED";
  }
  if (msg.includes("404") || msg.includes("not found")) {
    return "NOT_FOUND";
  }
  if (msg.includes("5") || msg.includes("server")) {
    return "SERVER_ERROR";
  }
  if (msg.includes("network") || msg.includes("timeout") || msg.includes("fetch")) {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN";
}

/**
 * Traduce un tipo de error a un mensaje amigable para el usuario
 */
export function getErrorMessage(errorType: ErrorType, context?: string): ErrorMessage {
  const messages: Record<ErrorType, ErrorMessage> = {
    GROUP_FULL: {
      title: "Grupo Lleno",
      message:
        "El grupo ha alcanzado su capacidad máxima. No puedes unirte en este momento.",
      type: "warning",
    },
    INVALID_TRANSITION: {
      title: "Acción no permitida",
      message:
        "El estado del grupo no permite realizar esta acción en este momento. Intenta recargar la página.",
      type: "warning",
    },
    ADMIN_TRANSFER_PENDING: {
      title: "Transferencia en proceso",
      message:
        "Ya existe una solicitud de transferencia de administrador pendiente. Espera a que se complete.",
      type: "info",
    },
    UNAUTHORIZED: {
      title: "Sesión expirada",
      message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
      type: "error",
      actionLabel: "Ir a login",
    },
    NOT_FOUND: {
      title: "No encontrado",
      message: `El ${context ?? "recurso"} que buscas no existe o fue eliminado.`,
      type: "warning",
    },
    SERVER_ERROR: {
      title: "Error del servidor",
      message: "Hubo un problema en el servidor. Por favor, intenta más tarde.",
      type: "error",
    },
    NETWORK_ERROR: {
      title: "Error de conexión",
      message:
        "No pudimos conectar con el servidor. Verifica tu conexión a internet.",
      type: "error",
    },
    UNKNOWN: {
      title: "Error desconocido",
      message: "Algo salió mal. Por favor, intenta nuevamente.",
      type: "error",
    },
  };

  return messages[errorType];
}

/**
 * Muestra un alerta con el mensaje de error (React Native Alert)
 * @param error Error a procesar
 * @param context Contexto adicional para personalizar el mensaje (ej: "grupo", "solicitud")
 */
export function showErrorAlert(error: unknown, context?: string): void {
  const errorType = parseBackendError(error);
  const { title, message } = getErrorMessage(errorType, context);

  Alert.alert(title, message, [
    {
      text: "OK",
      onPress: () => {
        // Noop
      },
    },
  ]);
}

/**
 * Hook-compatible: Procesa error y retorna el objeto para usar en componentes
 */
export function useErrorHandler() {
  return {
    parse: parseBackendError,
    getMessage: getErrorMessage,
    show: showErrorAlert,
  };
}
