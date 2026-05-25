import type { ConversationSummary, CreateConversationInput } from "../entities/Conversation.js";
import type { CreateMessageInput, Message, PollData, Reaction } from "../entities/Message.js";

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
  toggleReaction(messageId: string, currentUserId: string, emoji: string): Promise<{ conversationId: string; reactions: Reaction[] }>;

  voteInPoll(messageId: string, userId: string, optionIndex: number): Promise<{ conversationId: string; poll: PollData }>;
  closePoll(messageId: string): Promise<{ conversationId: string; poll: PollData }>;
}
