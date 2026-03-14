import type { Message } from "@/types"

/**
 * Interface for Message repository.
 * Defines contract for message data access (US-015/016).
 */
export interface IMessageRepository {
  getById(id: string): Promise<Message | null>
  getByConversation(conversationId: string, limit?: number, offset?: number): Promise<Message[]>
  create(conversationId: string, senderId: string, content: string): Promise<Message>
  markAsRead(messageId: string): Promise<void>
}
