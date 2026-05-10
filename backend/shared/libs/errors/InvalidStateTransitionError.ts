import { DomainError } from "./DomainError.js";

/**
 * Error lanzado cuando se intenta realizar una acción que no está permitida
 * en el estado actual del agregado (patrón State).
 *
 * Especialización de DomainError para mayor claridad y debugging.
 * Se mapea a HTTP 422 Unprocessable Entity.
 */
export class InvalidStateTransitionError extends DomainError {
  constructor(
    currentState: string,
    attemptedAction: string,
    message?: string,
  ) {
    const defaultMessage =
      message ||
      `La acción '${attemptedAction}' no está permitida en el estado '${currentState}'.`;
    super(defaultMessage);
    Object.setPrototypeOf(this, InvalidStateTransitionError.prototype);
  }
}
