import { ApplicationError } from "./ApplicationError.js";

export class PermissionError extends ApplicationError {
  readonly statusCode = 403;

  constructor(message: string) {
    super(message, "PermissionError");
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}
