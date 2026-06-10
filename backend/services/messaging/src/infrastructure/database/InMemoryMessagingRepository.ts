import { randomUUID } from "node:crypto";

import type {
  ConversationSummary,
  CreateConversationInput,
} from "../../domain/entities/Conversation.js";
import type { CreateMessageInput, Message, Reaction } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type {
  CreatePollConfigInput,
  PollConfigDTO,
  PollOptionResult,
  PollResultsDTO,
  VoteResultDTO,
} from "../../interfaces/http/dto/PollDTOs.js";
import { DuplicateVoteError } from "../../domain/errors/DuplicateVoteError.js";
import { PollClosedError } from "../../domain/errors/PollClosedError.js";

interface StoredConversation {
  id: string;
  participantA: string;
  participantB: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredPollConfig {
  id: string;
  messageId: string;
  groupId: string;
  createdBy: string;
  question: string;
  options: string[];
  expiresAt: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface StoredPollVote {
  id: string;
  pollId: string;
  userId: string;
  selectedOption: number;
  votedAt: string;
}

export class InMemoryMessagingRepository implements IMessagingRepository {
  private readonly conversations = new Map<string, StoredConversation>();
  private readonly messages = new Map<string, Message>();
  private readonly pollConfigs = new Map<string, StoredPollConfig>();
  private readonly pollVotes = new Map<string, StoredPollVote>();
  private readonly messageTimestamps = new Map<string, Date[]>();
  private readonly blockedUsers = new Map<string, { until: Date; reason: string }>();
  private readonly blockHistory: { userId: string; reason: string; timestamp: Date }[] = [];

  async getConversationById(id: string, currentUserId: string): Promise<ConversationSummary | null> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      return null;
    }

    if (!this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para acceder a esta conversacion.");
    }

    return this.toConversationSummary(conversation, currentUserId);
  }

  async listConversationsByUser(userId: string): Promise<ConversationSummary[]> {
    const items = [...this.conversations.values()]
      .filter((conversation) => this.isParticipant(conversation, userId))
      .map((conversation) => this.toConversationSummary(conversation, userId))
      .sort((a, b) => (a.lastMessageAt ?? a.updatedAt < (b.lastMessageAt ?? b.updatedAt) ? 1 : -1));

    return items;
  }

  async getOrCreateConversation(input: CreateConversationInput): Promise<ConversationSummary> {
    const normalized = [input.participantA, input.participantB].sort();
    const participantA = normalized[0];
    const participantB = normalized[1];

    const existing = [...this.conversations.values()].find(
      (conversation) =>
        conversation.participantA === participantA && conversation.participantB === participantB,
    );

    if (existing) {
      return this.toConversationSummary(existing, input.currentUserId);
    }

    const now = new Date().toISOString();
    const created: StoredConversation = {
      id: randomUUID(),
      participantA,
      participantB,
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(created.id, created);
    return this.toConversationSummary(created, input.currentUserId);
  }

  async touchConversation(conversationId: string, currentUserId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error("Conversacion no encontrada.");
    }

    if (!this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para actualizar esta conversacion.");
    }

    conversation.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conversation);
  }

  async getMessageById(id: string, currentUserId: string): Promise<Message | null> {
    const message = this.messages.get(id);
    if (!message) {
      return null;
    }

    const conversation = this.conversations.get(message.conversationId);
    if (!conversation) {
      return null;
    }

    if (!this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para acceder a este mensaje.");
    }

    return message;
  }

  async listMessages(
    conversationId: string,
    currentUserId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    if (!this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para acceder a estos mensajes.");
    }

    return [...this.messages.values()]
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
      .slice(offset, offset + limit);
  }

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const conversation = this.conversations.get(input.conversationId);
    if (!conversation) {
      throw new Error("Conversacion no encontrada.");
    }

    if (!this.isParticipant(conversation, input.senderId)) {
      throw new Error("No tienes permisos para enviar mensajes en esta conversacion.");
    }

    const message: Message = {
      id: randomUUID(),
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
      mediaUrl: input.mediaUrl ?? null,
      mediaType: input.mediaType ?? null,
      mediaFilename: input.mediaFilename ?? null,
      replyToMessageId: input.replyToMessageId ?? null,
      replyPreview: input.replyPreview ?? null,
      createdAt: new Date().toISOString(),
      readAt: null,
      reactions: [],
      poll: input.poll ?? null,
      sender: {
        fullName: "Usuario",
        avatarUrl: null,
      },
    };

    this.messages.set(message.id, message);

    conversation.updatedAt = new Date().toISOString();
    this.conversations.set(conversation.id, conversation);

    return message;
  }

  async markMessageAsRead(messageId: string, currentUserId: string): Promise<boolean> {
    const message = this.messages.get(messageId);
    if (!message) {
      return false;
    }

    const conversation = this.conversations.get(message.conversationId);
    if (!conversation) {
      return false;
    }

    if (!this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para actualizar este mensaje.");
    }

    if (message.senderId === currentUserId || message.readAt) {
      return true;
    }

    const updated: Message = {
      ...message,
      readAt: new Date().toISOString(),
    };

    this.messages.set(message.id, updated);
    return true;
  }

  async markConversationAsRead(conversationId: string, currentUserId: string): Promise<number> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error("Conversacion no encontrada.");
    }

    if (!this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para actualizar esta conversacion.");
    }

    const messagesToUpdate = [...this.messages.values()].filter(
      (msg) => msg.conversationId === conversationId && msg.senderId !== currentUserId && !msg.readAt
    );

    let markedCount = 0;
    const now = new Date().toISOString();

    for (const message of messagesToUpdate) {
      const updated: Message = {
        ...message,
        readAt: now,
      };
      this.messages.set(message.id, updated);
      markedCount++;
    }

    conversation.updatedAt = now;
    this.conversations.set(conversation.id, conversation);

    return markedCount;
  }

  async getUnreadCountForUser(currentUserId: string): Promise<number> {
    const conversationIds = new Set(
      [...this.conversations.values()]
        .filter((conversation) => this.isParticipant(conversation, currentUserId))
        .map((conversation) => conversation.id),
    );

    if (conversationIds.size === 0) {
      return 0;
    }

    return [...this.messages.values()].filter(
      (message) =>
        conversationIds.has(message.conversationId) &&
        message.senderId !== currentUserId &&
        !message.readAt,
    ).length;
  }

  private isParticipant(conversation: StoredConversation, userId: string): boolean {
    return conversation.participantA === userId || conversation.participantB === userId;
  }

  private toConversationSummary(
    conversation: StoredConversation,
    currentUserId: string,
  ): ConversationSummary {
    const otherUserId =
      conversation.participantA === currentUserId
        ? conversation.participantB
        : conversation.participantA;

    const messages = [...this.messages.values()]
      .filter((message) => message.conversationId === conversation.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const latest = messages[0];
    const unreadCount = messages.filter(
      (message) => message.senderId !== currentUserId && message.readAt === null,
    ).length;

    return {
      id: conversation.id,
      participantA: conversation.participantA,
      participantB: conversation.participantB,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      otherUserId,
      otherUserName: "Usuario",
      otherUserAvatar: null,
      lastMessage: latest ? latest.content || (latest.mediaUrl ? "📷 Foto" : null) : null,
      lastMessageAt: latest?.createdAt ?? null,
      unreadCount,
    };
  }

  async toggleReaction(messageId: string, currentUserId: string, emoji: string) {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error("Mensaje no encontrado.");
    }

    const conversation = this.conversations.get(message.conversationId);
    if (!conversation || !this.isParticipant(conversation, currentUserId)) {
      throw new Error("No tienes permisos para reaccionar a este mensaje.");
    }

    const current = message.reactions ?? [];
    const existingIdx = current.findIndex((r) => r.emoji === emoji && r.userId === currentUserId);

    let updated: Reaction[];
    if (existingIdx >= 0) {
      updated = current.filter((_, i) => i !== existingIdx);
    } else {
      updated = [...current, { emoji, userId: currentUserId }];
    }

    this.messages.set(messageId, { ...message, reactions: updated });
    return { conversationId: message.conversationId, reactions: updated };
  }

  async voteInPoll(messageId: string, userId: string, optionIndex: number) {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error("Mensaje no encontrado.");
    }

    if (!message.poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    if (!message.poll.isOpen) {
      throw new Error("La encuesta ya está cerrada.");
    }

    if (optionIndex < 0 || optionIndex >= message.poll.options.length) {
      throw new Error("Opción inválida.");
    }

    const alreadyVoted = message.poll.options.some((opt) =>
      opt.votes.includes(userId),
    );
    if (alreadyVoted) {
      throw new Error("Ya has votado en esta encuesta.");
    }

    const updatedOptions = message.poll.options.map((opt, i) => {
      if (i === optionIndex) {
        return { ...opt, votes: [...opt.votes, userId] };
      }
      return opt;
    });

    const updatedPoll = {
      ...message.poll,
      options: updatedOptions,
    };

    this.messages.set(messageId, { ...message, poll: updatedPoll });
    return { conversationId: message.conversationId, poll: updatedPoll };
  }

  async closePoll(messageId: string) {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error("Mensaje no encontrado.");
    }

    if (!message.poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    const updatedPoll = {
      ...message.poll,
      isOpen: false,
    };

    this.messages.set(messageId, { ...message, poll: updatedPoll });
    return { conversationId: message.conversationId, poll: updatedPoll };
  }

  private calculateResults(pollId: string, config: StoredPollConfig): {
    results: PollOptionResult[];
    totalVotes: number;
  } {
    const votes = [...this.pollVotes.values()].filter((v) => v.pollId === pollId);
    const totalVotes = votes.length;

    const results: PollOptionResult[] = config.options.map((option, idx) => {
      const count = votes.filter((v) => v.selectedOption === idx).length;
      const percentage = totalVotes > 0
        ? Math.round((count / totalVotes) * 100 * 10) / 10
        : 0;
      return { option, count, percentage };
    });

    return { results, totalVotes };
  }

  async createPollConfig(input: CreatePollConfigInput): Promise<PollConfigDTO> {
    const now = new Date().toISOString();
    const config: StoredPollConfig = {
      id: randomUUID(),
      messageId: input.messageId,
      groupId: input.groupId,
      createdBy: input.createdBy,
      question: input.question,
      options: [...input.options],
      expiresAt: input.expiresAt,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.pollConfigs.set(config.id, config);

    const { results, totalVotes } = this.calculateResults(config.id, config);

    return {
      pollId: config.id,
      messageId: config.messageId,
      groupId: config.groupId,
      createdBy: config.createdBy,
      question: config.question,
      options: [...config.options],
      expiresAt: config.expiresAt,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      results,
      totalVotes,
    };
  }

  async castVote(pollId: string, userId: string, selectedOption: number): Promise<VoteResultDTO> {
    const config = this.pollConfigs.get(pollId);
    if (!config) {
      throw new Error("Encuesta no encontrada");
    }

    if (config.status === 'closed') {
      throw new PollClosedError();
    }

    if (new Date(config.expiresAt) <= new Date()) {
      config.status = 'closed';
      config.updatedAt = new Date().toISOString();
      this.pollConfigs.set(pollId, config);
      throw new PollClosedError();
    }

    if (selectedOption < 0 || selectedOption >= config.options.length) {
      throw new Error(`Opción inválida: debe estar entre 0 y ${config.options.length - 1}`);
    }

    const existingVote = [...this.pollVotes.values()].find(
      (v) => v.pollId === pollId && v.userId === userId,
    );
    if (existingVote) {
      throw new DuplicateVoteError();
    }

    const vote: StoredPollVote = {
      id: randomUUID(),
      pollId,
      userId,
      selectedOption,
      votedAt: new Date().toISOString(),
    };

    this.pollVotes.set(vote.id, vote);

    const { results, totalVotes } = this.calculateResults(pollId, config);

    return {
      success: true,
      pollId,
      userId,
      selectedOption,
      results,
      totalVotes,
    };
  }

  async getPollResults(pollId: string): Promise<PollResultsDTO> {
    const config = this.pollConfigs.get(pollId);
    if (!config) {
      throw new Error("Encuesta no encontrada");
    }

    const { results, totalVotes } = this.calculateResults(pollId, config);

    return {
      pollId,
      question: config.question,
      status: config.status,
      results,
      totalVotes,
    };
  }

  async closeExpiredPolls(): Promise<string[]> {
    const now = new Date();
    const closedIds: string[] = [];

    for (const [id, config] of this.pollConfigs) {
      if (config.status === 'active' && new Date(config.expiresAt) <= now) {
        config.status = 'closed';
        config.updatedAt = now.toISOString();
        this.pollConfigs.set(id, config);
        closedIds.push(id);
      }
    }

    return closedIds;
  }

  async getPollGroupId(pollId: string): Promise<string> {
    const config = this.pollConfigs.get(pollId);
    if (!config) {
      throw new Error(`Encuesta no encontrada: ${pollId}`);
    }

    return config.groupId;
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const expiration = await this.getUserBlockExpiration(userId);
    return !!expiration;
  }

  async getUserBlockExpiration(userId: string): Promise<Date | null> {
    const block = this.blockedUsers.get(userId);
    if (!block) {
      return null;
    }

    if (new Date() < block.until) {
      return block.until;
    }

    this.blockedUsers.delete(userId);
    return null;
  }


  async blockUser(userId: string, durationMinutes: number, reason: string): Promise<void> {
    const until = new Date(Date.now() + durationMinutes * 60000);
    this.blockedUsers.set(userId, { until, reason });
    console.warn(`[Moderación] Usuario ${userId} bloqueado por ${durationMinutes} minutos. Razón: ${reason}`);
  }

  async recordMessageTimestamp(userId: string): Promise<number> {
    const now = new Date();
    const limitTime = new Date(now.getTime() - 30000);

    const userTimestamps = this.messageTimestamps.get(userId) ?? [];
    const recentTimestamps = userTimestamps.filter((t) => t >= limitTime);
    recentTimestamps.push(now);

    this.messageTimestamps.set(userId, recentTimestamps);
    return recentTimestamps.length;
  }

  async recordBlockEvent(userId: string, reason: string): Promise<void> {
    this.blockHistory.push({ userId, reason, timestamp: new Date() });
  }

  async countBlocksInLastHour(userId: string): Promise<number> {
    const limitTime = new Date(Date.now() - 60 * 60 * 1000);
    return this.blockHistory.filter((item) => item.userId === userId && item.timestamp >= limitTime).length;
  }
}
