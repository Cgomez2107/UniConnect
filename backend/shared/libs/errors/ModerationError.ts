import { ApplicationError } from "./ApplicationError.js";

export class ModerationError extends ApplicationError {
  readonly statusCode: number;

  constructor(
    message: string,
    public readonly code: string = "MO_003",
  ) {
    super(message, "ModerationError");
    Object.setPrototypeOf(this, ModerationError.prototype);
    this.statusCode = code === "MO_003" ? 429 : 400;
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
