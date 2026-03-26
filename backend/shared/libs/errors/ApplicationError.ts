/**
 * Clase base para todos los errores de aplicación.
 * Cada tipo de error tiene su statusCode asociado.
 */
export abstract class ApplicationError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string, name: string) {
    super(message);
    this.name = name;
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
