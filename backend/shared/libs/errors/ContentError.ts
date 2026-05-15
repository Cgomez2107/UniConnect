import { ApplicationError } from "./ApplicationError.js";

export class ContentError extends ApplicationError {
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly reason: string = "forbidden_words",
  ) {
    super(message, "ContentError");
    Object.setPrototypeOf(this, ContentError.prototype);
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
