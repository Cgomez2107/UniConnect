import { randomUUID } from "node:crypto";

import type {
  ConversationSummary,
  CreateConversationInput,
} from "../../domain/entities/Conversation.js";
import type { CreateMessageInput, Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

interface StoredConversation {
  id: string;
  participantA: string;
  participantB: string;
  createdAt: string;
  updatedAt: string;
}

export class InMemoryMessagingRepository implements IMessagingRepository {
  private readonly conversations = new Map<string, StoredConversation>();
  private readonly messages = new Map<string, Message>();

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
}
