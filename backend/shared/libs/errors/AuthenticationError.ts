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

  constructor(message: string = "Authentication required") {
    super(message, "AuthenticationError");
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
