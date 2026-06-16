import type { DomainError, ApiErrorResponse } from "@uniconnect/shared-types";

export type ErrorType =
  | "GROUP_FULL"
  | "INVALID_TRANSITION"
  | "ADMIN_TRANSFER_PENDING"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface ErrorMessage {
  title: string;
  message: string;
  type: "error" | "warning" | "info";
}

function parseDomainError(error: DomainError): ErrorType {
  switch (error.code) {
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "FORBIDDEN":
      return "GROUP_FULL";
    case "CONFLICT":
      return "INVALID_TRANSITION";
    case "SERVICE_UNAVAILABLE":
      return "SERVER_ERROR";
    case "NETWORK_ERROR":
      return "NETWORK_ERROR";
    case "TIMEOUT":
      return "NETWORK_ERROR";
    case "BAD_REQUEST":
      return "UNKNOWN";
    case "INTERNAL_SERVER_ERROR":
      return "SERVER_ERROR";
    case "VALIDATION_ERROR":
      return "UNKNOWN";
    default:
      return "UNKNOWN";
  }
}

export function parseBackendError(error: unknown): ErrorType {
  if (error && typeof error === "object" && "code" in error) {
    return parseDomainError(error as DomainError);
  }

  if (!(error instanceof Error)) {
    return "UNKNOWN";
  }

  const msg = error.message.toLowerCase();

  if (msg.includes("full") || msg.includes("capacity") || msg.includes("llena")) {
    return "GROUP_FULL";
  }
  if (msg.includes("invalid") || msg.includes("transition") || msg.includes("no permitida") || msg.includes("disuelto") || msg.includes("bloqueado")) {
    return "INVALID_TRANSITION";
  }
  if (msg.includes("transfer") || msg.includes("transferencia") || msg.includes("único admin") || msg.includes("unico admin")) {
    return "ADMIN_TRANSFER_PENDING";
  }
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("no autorizado")) {
    return "UNAUTHORIZED";
  }
  if (msg.includes("404") || msg.includes("not found") || msg.includes("no encontrado")) {
    return "NOT_FOUND";
  }
  if (msg.includes("5") || msg.includes("server") || msg.includes("servidor")) {
    return "SERVER_ERROR";
  }
  if (msg.includes("network") || msg.includes("timeout") || msg.includes("fetch")) {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN";
}

export function getErrorMessage(errorType: ErrorType, context?: string): ErrorMessage {
  const messages: Record<ErrorType, ErrorMessage> = {
    GROUP_FULL: {
      title: "Grupo Lleno",
      message: "El grupo ha alcanzado su capacidad máxima. No puedes unirte en este momento.",
      type: "warning",
    },
    INVALID_TRANSITION: {
      title: "Acción no permitida",
      message: "El estado del grupo no permite realizar esta acción. El grupo puede estar disuelto, bloqueado o con una transferencia en curso.",
      type: "warning",
    },
    ADMIN_TRANSFER_PENDING: {
      title: "Transferencia en proceso",
      message: "Ya existe una solicitud de transferencia de administrador pendiente o no puedes renunciar como único administrador.",
      type: "info",
    },
    UNAUTHORIZED: {
      title: "Sesión expirada",
      message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
      type: "error",
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
      message: "No pudimos conectar con el servidor. Verifica tu conexión a internet.",
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

export function showErrorAlert(error: unknown, context?: string): void {
  const errorType = parseBackendError(error);
  const { title, message } = getErrorMessage(errorType, context);
  alert(`${title}\n\n${message}`);
}
