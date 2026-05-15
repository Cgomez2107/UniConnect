import { ApplicationError } from "./ApplicationError.js";

export class SizeError extends ApplicationError {
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly reason: "empty" | "max_length" = "max_length",
    public readonly maxLength?: number,
  ) {
    super(message, "SizeError");
    Object.setPrototypeOf(this, SizeError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      reason: this.reason,
      maxLength: this.maxLength,
    };
  }
}
