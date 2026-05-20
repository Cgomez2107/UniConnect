import { ApplicationError } from "../../../../../shared/libs/errors/ApplicationError.js";

export class PollClosedError extends ApplicationError {
  readonly statusCode = 400;
  readonly code = 'POLL_CLOSED';

  constructor() {
    super('La encuesta ya está cerrada', 'PollClosedError');
    Object.setPrototypeOf(this, PollClosedError.prototype);
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
