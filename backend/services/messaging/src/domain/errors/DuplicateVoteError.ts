import { ApplicationError } from "../../../../../shared/libs/errors/ApplicationError.js";

/**
 * Error lanzado cuando un estudiante intenta votar más de una vez
 * en la misma encuesta. La restricción UNIQUE (poll_id, user_id)
 * en la tabla poll_votes previene el duplicado a nivel DB, y este
 * error se usa para propagar el mensaje al cliente como HTTP 400.
 *
 * HTTP 400 — Bad Request
 * Código de aplicación: DUPLICATE_VOTE
 */
export class DuplicateVoteError extends ApplicationError {
  readonly statusCode = 400;
  readonly code = 'DUPLICATE_VOTE';

  constructor() {
    super('Ya has votado en esta encuesta', 'DuplicateVoteError');
    Object.setPrototypeOf(this, DuplicateVoteError.prototype);
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
