/**
 * Base class for all domain-specific errors.
 * These represent business logic violations, not technical issues.
 */
export abstract class DomainError extends Error {
  readonly message!: string

  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, DomainError.prototype)
  }
}

/**
 * Thrown when a requested resource doesn't exist.
 */
export class NotFoundError extends DomainError {
  constructor(entityName: string, identifier: string) {
    super(`${entityName} con ID "${identifier}" no existe`)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Thrown when user is not authorized to perform an action.
 */
export class UnauthorizedError extends DomainError {
  constructor(action: string, reason?: string) {
    const msg = reason ? `No autorizado para ${action}. ${reason}` : `No autorizado para ${action}`
    super(msg)
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

/**
 * Thrown when business rule validation fails.
 */
export class ValidationError extends DomainError {
  readonly property: string
  constructor(propertyOrMessage: string, message?: string) {
    if (message) {
      super(message)
      this.property = propertyOrMessage
    } else {
      super(propertyOrMessage)
      this.property = ""
    }
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Thrown when operation conflicts with existing state.
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}
