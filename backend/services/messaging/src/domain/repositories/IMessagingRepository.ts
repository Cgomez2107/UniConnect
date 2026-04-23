import type { ConversationSummary, CreateConversationInput } from "../entities/Conversation.js";
import type { CreateMessageInput, Message } from "../entities/Message.js";

export interface IMessagingRepository {
  getConversationById(id: string, currentUserId: string): Promise<ConversationSummary | null>;
  listConversationsByUser(userId: string): Promise<ConversationSummary[]>;
  getOrCreateConversation(input: CreateConversationInput): Promise<ConversationSummary>;
  touchConversation(conversationId: string, currentUserId: string): Promise<void>;

  getMessageById(id: string, currentUserId: string): Promise<Message | null>;
  listMessages(
    conversationId: string,
    currentUserId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]>;
  createMessage(input: CreateMessageInput): Promise<Message>;
  markMessageAsRead(messageId: string, currentUserId: string): Promise<boolean>;
  markConversationAsRead(conversationId: string, currentUserId: string): Promise<number>;
  getUnreadCountForUser(currentUserId: string): Promise<number>;
}
