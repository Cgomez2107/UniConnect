import { ApplicationError } from "./ApplicationError.js";

/**
 * Error 409 Conflict
 * Lanzar cuando:
 * - Recurso ya existe (duplicate)
 * - Estado inválido para la operación
 * - Constraint violation (ej: email ya registrado)
 */
export class ConflictError extends ApplicationError {
  readonly statusCode = 409;

  constructor(message: string = "Conflict") {
    super(message, "ConflictError");
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
