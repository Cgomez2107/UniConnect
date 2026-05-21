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

export interface DomainError {
  code: ErrorCode;
  message: string;
  severity: "error" | "warning" | "info";
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

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
