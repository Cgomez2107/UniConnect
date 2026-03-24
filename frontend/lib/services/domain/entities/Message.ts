import { Entity } from "./Entity"

/**
 * Message entity (1:1 conversation)
 * 
 * TODO: Define properties and business logic
 * - conversation: ConversationId
 * - sender: UserId
 * - content: string
 * - createdAt: Date
 * - readAt?: Date
 */
export class Message extends Entity<any> {
  toPrimitive() {
    return { id: this.id }
  }
}
