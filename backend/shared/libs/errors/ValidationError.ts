import { ApplicationError } from "./ApplicationError.js";

/**
 * Error 400 Bad Request
 * Lanzar cuando:
 * - Validación de input falla
 * - Campos requeridos falta
 * - Valores fuera de rango
 * - Formato inválido
 */
export class ValidationError extends ApplicationError {
  readonly statusCode = 400;

  constructor(message: string = "Validation failed") {
    super(message, "ValidationError");
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
