/**
 * Base Messaging Client
 * HTTP-only client for messaging operations
 * Does NOT include WebSocket realtime logic (delegated to Decorator)
 */

import type { ITransport } from "../../transport/index.js";
import {
  mapConversationDtoToDomain,
  mapMessageDtoToDomain,
  mapMessageDomainToDto,
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
  type?: "text" | "file" | "mention" | "reaction";
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
      url: "/messaging/conversations",
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
      url: `/messaging/conversations/${conversationId}`,
    });

    return mapConversationDtoToDomain(response.data);
  }

  /**
   * Create direct message conversation with another user
   */
  async createDirectConversation(userId: string): Promise<Conversation> {
    const response = await this.transport.request<ConversationDTO>({
      method: "POST",
      url: "/messaging/conversations/direct",
      body: { user_id: userId },
    });

    return mapConversationDtoToDomain(response.data);
  }

  /**
   * Create group conversation
   */
  async createGroupConversation(
    name: string,
    participantIds: string[]
  ): Promise<Conversation> {
    const response = await this.transport.request<ConversationDTO>({
      method: "POST",
      url: "/messaging/conversations/group",
      body: {
        name,
        participant_ids: participantIds,
      },
    });

    return mapConversationDtoToDomain(response.data);
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(params: GetMessagesParams): Promise<Message[]> {
    const response = await this.transport.request<MessageDTO[]>({
      method: "GET",
      url: `/messaging/conversations/${params.conversationId}/messages`,
      params: {
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
      url: `/messaging/conversations/${payload.conversationId}/messages`,
      body: {
        content: payload.content,
        type: payload.type || "text",
      },
    });

    return mapMessageDtoToDomain(response.data);
  }

  /**
   * Edit message
   */
  async editMessage(conversationId: string, messageId: string, content: string): Promise<Message> {
    const response = await this.transport.request<MessageDTO>({
      method: "PUT",
      url: `/messaging/conversations/${conversationId}/messages/${messageId}`,
      body: { content },
    });

    return mapMessageDtoToDomain(response.data);
  }

  /**
   * Delete message
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await this.transport.request({
      method: "DELETE",
      url: `/messaging/conversations/${conversationId}/messages/${messageId}`,
    });
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<Message> {
    const response = await this.transport.request<MessageDTO>({
      method: "POST",
      url: `/messaging/conversations/${conversationId}/messages/${messageId}/reactions`,
      body: { emoji },
    });

    return mapMessageDtoToDomain(response.data);
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<Message> {
    const response = await this.transport.request<MessageDTO>({
      method: "DELETE",
      url: `/messaging/conversations/${conversationId}/messages/${messageId}/reactions/${emoji}`,
    });

    return mapMessageDtoToDomain(response.data);
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.transport.request({
      method: "PUT",
      url: `/messaging/conversations/${conversationId}/read`,
    });
  }

  /**
   * Mark all conversations as read
   */
  async markAllAsRead(): Promise<void> {
    await this.transport.request({
      method: "PUT",
      url: "/messaging/conversations/read-all",
    });
  }
}
