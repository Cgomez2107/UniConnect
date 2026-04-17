import { Entity } from "./Entity"

/**
 * Event entity (academic or cultural)
 * 
 * TODO: Define properties and business logic
 * - title: string
import { Entity } from "./Entity"

/**
 * Event entity (academic or cultural)
 * 
 * TODO: Define properties and business logic
 * - title: string
 * - description: string
 * - location: string
 * - date: Date
 * - createdBy: UserId (admin)
 * - status: EventStatus
 */
export class Event extends Entity<any> {
  toPrimitive() {
    return { id: this.id }
  }
}
