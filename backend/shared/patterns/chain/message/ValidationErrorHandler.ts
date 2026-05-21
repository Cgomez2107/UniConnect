/**
 * Middleware para error handling en el gateway
 * Convierte errores de validación en respuestas HTTP consistentes
 */

import { ValidationErrorMapper } from "./ValidationErrorMapper.js";
import { ValidatorError } from "@uniconnect/shared-types";

/**
 * Tipos de errores que el middleware sabe manejar
 */
interface ErrorResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Error handler para validación de mensajes en la cadena de responsabilidad
 */
export function handleValidationError(error: Error): ErrorResponse {
  // Si es un ValidatorError, usar el mapper
  if (error instanceof ValidatorError || error.name === "ValidatorError") {
    const httpResponse = ValidationErrorMapper.toHttpResponse(error);

    return {
      statusCode: httpResponse.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(httpResponse.body),
    };
  }

  // Fallback para otros errores de validación
  const httpResponse = ValidationErrorMapper.toHttpResponse(error);

  return {
    statusCode: httpResponse.statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(httpResponse.body),
  };
}

/**
 * Determina si un error debe ser tratado como error de validación
 */
export function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const validationErrorNames = [
    "ValidatorError",
    "SizeError",
    "ContentError",
    "MediaError",
    "PermissionError",
    "MentionError",
    "ValidationError",
  ];

  return validationErrorNames.includes(error.name);
}

/**
 * Middleware express para capturar y manejar errores de validación
 * Uso en gateway:
 *
 * app.use((err, req, res, next) => {
 *   const handler = createValidationErrorHandler();
 *   handler(err, req, res, next);
 * });
 */
export function createValidationErrorHandler() {
  return (
    err: Error,
    req: any,
    res: any,
    next: (err?: Error) => void
  ): void => {
    if (!isValidationError(err)) {
      // Pasar al siguiente middleware si no es error de validación
      return next(err);
    }

    const response = handleValidationError(err);

    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
  };
}
