/**
 * Base class for all domain entities.
 * Entities have identity and are mutable.
 * They should encapsulate business logic and rules.
 */
export abstract class Entity<T> {
  protected readonly id: string

  constructor(id: string) {
    this.id = id
  }

  getId(): string {
    return this.id
  }

  /**
   * Compare structural equality by ID.
   * Override if needed for richer equality checks.
   */
  equals(other: Entity<T>): boolean {
    return this.id === other.id
  }

  /**
   * Convert entity to plain object (for serialization/DTO).
   * To be implemented by subclasses.
   */
  abstract toPrimitive(): T
}
