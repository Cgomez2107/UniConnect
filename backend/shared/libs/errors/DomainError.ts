import { ApplicationError } from "./ApplicationError.js";

/**
 * Error lanzado cuando una acción viola las reglas de negocio del dominio.
 * Producido por los estados del patrón State cuando una transición no es válida.
 * Se mapea a HTTP 422 Unprocessable Entity.
 */
export class DomainError extends ApplicationError {
  readonly statusCode = 422;

  constructor(message: string) {
    super(message, "DomainError");
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
