import { ZodError } from "zod";

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
