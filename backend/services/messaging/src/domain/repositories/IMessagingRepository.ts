import type { ConversationSummary, CreateConversationInput } from "../entities/Conversation.js";
import type { CreateMessageInput, Message, PollData, Reaction } from "../entities/Message.js";
import type {
  CreatePollConfigInput,
  PollConfigDTO,
  VoteResultDTO,
  PollResultsDTO,
} from "../../interfaces/http/dto/PollDTOs.js";

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
  createPollConfig(input: CreatePollConfigInput): Promise<PollConfigDTO>;
  castVote(pollId: string, userId: string, selectedOption: number): Promise<VoteResultDTO>;
  getPollResults(pollId: string): Promise<PollResultsDTO>;
  closeExpiredPolls(): Promise<string[]>;
  getPollGroupId(pollId: string): Promise<string>;
  isUserBlocked(userId: string): Promise<boolean>;
  blockUser(userId: string, durationMinutes: number, reason: string): Promise<void>;
  recordMessageTimestamp(userId: string): Promise<number>;
  getUserBlockExpiration?(userId: string): Promise<Date | null>;
}
