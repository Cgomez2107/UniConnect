import type { Message } from "@/types"

export interface CreateMessagePayload {
  content?: string
  media_url?: string
  media_type?: string
  media_filename?: string
  reply_to_message_id?: string
  reply_preview?: string
}

/**
 * Interface for Message repository.
 * Defines contract for message data access (US-015/016).
 */
export interface IMessageRepository {
  getById(id: string): Promise<Message | null>
  getByConversation(conversationId: string, limit?: number, offset?: number): Promise<Message[]>
  create(
    conversationId: string,
    senderId: string,
    payload: string | CreateMessagePayload
  ): Promise<Message>
  markAsRead(messageId: string): Promise<void>
  markConversationAsRead(conversationId: string): Promise<number>
  getTotalUnreadCount(): Promise<number>
}
