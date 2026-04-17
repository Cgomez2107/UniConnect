import { ApplicationError } from "./ApplicationError.js";

/**
 * Error 403 Forbidden
 * Lanzar cuando:
 * - Usuario autenticado pero sin permisos
 * - Admin requerido, pero es estudiante
 * - No es el propietario del recurso
 */
export class AuthorizationError extends ApplicationError {
  readonly statusCode = 403;

  constructor(message: string = "Insufficient permissions") {
    super(message, "AuthorizationError");
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
