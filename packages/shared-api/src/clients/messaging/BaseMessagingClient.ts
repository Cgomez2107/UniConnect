/**
 * Base Messaging Client
 * HTTP-only client for messaging operations
 * Does NOT include WebSocket realtime logic (delegated to Decorator)
 */

import type { ITransport } from "../../transport/index.js";
import {
  mapConversationDtoToDomain,
  mapMessageDtoToDomain,
} from "../../mappers/index.js";
import type {
  ConversationDTO,
  MessageDTO,
  Conversation,
  Message,
} from "@uniconnect/shared-types";

export interface GetConversationsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaFilename?: string;
  replyToMessageId?: string;
  replyPreview?: string;
}

export interface GetMessagesParams {
  conversationId: string;
  limit?: number;
  offset?: number;
}

/**
 * Base Messaging Client for HTTP operations only
 * Principle: Single Responsibility - handles HTTP requests
 * WebSocket and realtime features are added via Decorator pattern
 */
export class BaseMessagingClient {
  constructor(private transport: ITransport) {}

  /**
   * Get all conversations for current user
   */
  async getConversations(params?: GetConversationsParams): Promise<Conversation[]> {
    const response = await this.transport.request<ConversationDTO[]>({
      method: "GET",
      url: "/conversations",
      params: {
        ...(params?.limit !== undefined && { limit: params.limit }),
        ...(params?.offset !== undefined && { offset: params.offset }),
        ...(params?.search !== undefined && { search: params.search }),
      },
    });

    return response.data.map((dto) => mapConversationDtoToDomain(dto));
  }

  /**
   * Get single conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.transport.request<ConversationDTO>({
      method: "GET",
      url: `/conversations/${conversationId}`,
    });

    return mapConversationDtoToDomain(response.data);
  }

  /**
   * Create or get a direct conversation with another user
   */
  async createConversation(participantB: string): Promise<Conversation> {
    const response = await this.transport.request<ConversationDTO>({
      method: "POST",
      url: "/conversations",
      body: { participantB },
    });

    return mapConversationDtoToDomain(response.data);
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(params: GetMessagesParams): Promise<Message[]> {
    const response = await this.transport.request<MessageDTO[]>({
      method: "GET",
      url: "/messages",
      params: {
        conversationId: params.conversationId,
        ...(params.limit !== undefined && { limit: params.limit }),
        ...(params.offset !== undefined && { offset: params.offset }),
      },
    });

    return response.data.map((dto) => mapMessageDtoToDomain(dto));
  }

  /**
   * Send message via HTTP (for non-realtime or when socket unavailable)
   */
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const response = await this.transport.request<MessageDTO>({
      method: "POST",
      url: "/messages",
      body: {
        conversationId: payload.conversationId,
        content: payload.content,
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.mediaUrl !== undefined && { mediaUrl: payload.mediaUrl }),
        ...(payload.mediaType !== undefined && { mediaType: payload.mediaType }),
        ...(payload.mediaFilename !== undefined && { mediaFilename: payload.mediaFilename }),
        ...(payload.replyToMessageId !== undefined && { replyToMessageId: payload.replyToMessageId }),
        ...(payload.replyPreview !== undefined && { replyPreview: payload.replyPreview }),
      },
    });

    return mapMessageDtoToDomain(response.data);
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.transport.request({
      method: "PATCH",
      url: `/conversations/${conversationId}/read`,
    });
  }

  /**
   * Get unread messages count
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.transport.request<{ count: number }>({
      method: "GET",
      url: "/messages/unread-count",
    });
    return response.data.count;
  }

  /**
   * Toggle a reaction on a message (add if not present, remove if present)
   */
  async toggleReaction(messageId: string, emoji: string): Promise<{ emoji: string; userId: string }[]> {
    const response = await this.transport.request<{ reactions: { emoji: string; userId: string }[] }>({
      method: "POST",
      url: `/messages/${messageId}/reactions`,
      body: { emoji },
    });
    return response.data.reactions;
  }
}
