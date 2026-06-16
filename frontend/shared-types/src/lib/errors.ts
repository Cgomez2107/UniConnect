import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export interface DomainError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
  errorCode?: string;
  name?: string;
  reason?: string;
  remainingMs?: number;
  details?: Record<string, unknown>;
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: unknown;
}

export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_SERVER_ERROR",
  503: "SERVICE_UNAVAILABLE",
  408: "TIMEOUT",
};

export const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 408,
  VALIDATION_ERROR: 400,
  NETWORK_ERROR: 0,
  UNKNOWN_ERROR: 500,
};

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "Autenticación requerida. Por favor inicia sesión.",
  FORBIDDEN: "No tienes permisos para acceder a este recurso.",
  NOT_FOUND: "El recurso solicitado no fue encontrado.",
  BAD_REQUEST: "La solicitud contiene datos inválidos.",
  CONFLICT: "La operación entra en conflicto con los datos existentes.",
  INTERNAL_SERVER_ERROR: "Error interno del servidor. Por favor intenta más tarde.",
  SERVICE_UNAVAILABLE: "El servicio no está disponible en este momento.",
  TIMEOUT: "La solicitud tardó demasiado tiempo. Por favor intenta nuevamente.",
  VALIDATION_ERROR: "Los datos proporcionados no son válidos.",
  NETWORK_ERROR: "Error de conexión. Verifica tu conexión a internet.",
  UNKNOWN_ERROR: "Ocurrió un error inesperado.",
};

export function zodErrorToApiError(error: ZodError): ApiErrorResponse {
  const flattened = error.flatten();
  return {
    error: "VALIDATION_ERROR",
    message: "El cuerpo de la solicitud no cumple el contrato",
    details: {
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    },
  };
}
