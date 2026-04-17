/**
 * Base class for Value Objects.
 * Value Objects are immutable and don't have identity.
 * Equality is based on structural equality, not identity.
 */
export abstract class ValueObject<T> {
  protected readonly props: T

  constructor(props: T) {
    this.props = props
  }

  /**
   * Compare structural equality.
   */
  abstract equals(other: ValueObject<T>): boolean

  /**
   * Convert to primitive for serialization.
   */
  abstract toPrimitive(): unknown
}
