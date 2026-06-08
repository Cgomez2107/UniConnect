import { ApplicationError } from "./ApplicationError.js";

export class ModerationError extends ApplicationError {
  readonly statusCode = 429;

  constructor(
    message: string,
    public readonly code: string = "MO_003",
  ) {
    super(message, "ModerationError");
    Object.setPrototypeOf(this, ModerationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
    };
  }
}
