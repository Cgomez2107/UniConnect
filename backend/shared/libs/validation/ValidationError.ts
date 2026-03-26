import { ApplicationError } from "../errors/ApplicationError.js";

/**
 * Error de validación (400 Bad Request)
 * Contiene detalles de qué campos fallaron
 */
export class DtoValidationError extends ApplicationError {
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly fields: Record<string, string>,
  ) {
    super(message, "DtoValidationError");
    Object.setPrototypeOf(this, DtoValidationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      fields: this.fields,
    };
  }
}
