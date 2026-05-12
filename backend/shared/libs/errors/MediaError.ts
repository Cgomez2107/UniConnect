import { ApplicationError } from "./ApplicationError.js";

export class MediaError extends ApplicationError {
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly reason: "unsupported_type" | "filename_too_long" = "unsupported_type",
  ) {
    super(message, "MediaError");
    Object.setPrototypeOf(this, MediaError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      reason: this.reason,
    };
  }
}
