import { ApplicationError } from "./ApplicationError.js";

/**
 * Error 404 Not Found
 * Lanzar cuando:
 * - Recurso no existe
 * - Usuario no encontrado
 * - Conversación no existe
 */
export class NotFoundError extends ApplicationError {
  readonly statusCode = 404;

  constructor(message: string = "Resource not found") {
    super(message, "NotFoundError");
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
