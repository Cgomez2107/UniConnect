import { ApplicationError } from "./ApplicationError.js";

/**
 * Error 401 Unauthorized
 * Lanzar cuando:
 * - JWT ausente o inválido
 * - Token expirado
 * - Credenciales incorrectas
 */
export class AuthenticationError extends ApplicationError {
  readonly statusCode = 401;
  readonly details?: Record<string, unknown>;

  constructor(message: string = "Authentication required", details?: Record<string, unknown>) {
    super(message, "AuthenticationError");
    this.details = details;
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
