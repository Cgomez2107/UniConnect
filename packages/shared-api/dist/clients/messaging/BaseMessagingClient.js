/**
 * Base Messaging Client
 * HTTP-only client for messaging operations
 * Does NOT include WebSocket realtime logic (delegated to Decorator)
 */
import { mapConversationDtoToDomain, mapMessageDtoToDomain, } from "../../mappers/index.js";
/**
 * Base Messaging Client for HTTP operations only
 * Principle: Single Responsibility - handles HTTP requests
 * WebSocket and realtime features are added via Decorator pattern
 */
export class BaseMessagingClient {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    /**
     * Get all conversations for current user
     */
    async getConversations(params) {
        const response = await this.transport.request({
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
    async getConversation(conversationId) {
        const response = await this.transport.request({
            method: "GET",
            url: `/conversations/${conversationId}`,
        });
        return mapConversationDtoToDomain(response.data);
    }
    /**
     * Create or get a direct conversation with another user
     */
    async createConversation(participantB) {
        const response = await this.transport.request({
            method: "POST",
            url: "/conversations",
            body: { participantB },
        });
        return mapConversationDtoToDomain(response.data);
    }
    /**
     * Get messages in a conversation
     */
    async getMessages(params) {
        const response = await this.transport.request({
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
    async sendMessage(payload) {
        const response = await this.transport.request({
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
                ...(payload.poll !== undefined && { poll: payload.poll }),
            },
        });
        return mapMessageDtoToDomain(response.data);
    }
    /**
     * Mark conversation as read
     */
    async markConversationAsRead(conversationId) {
        await this.transport.request({
            method: "PATCH",
            url: `/conversations/${conversationId}/read`,
        });
    }
    /**
     * Get unread messages count
     */
    async getUnreadCount() {
        const response = await this.transport.request({
            method: "GET",
            url: "/messages/unread-count",
        });
        return response.data.count;
    }
    /**
     * Toggle a reaction on a message (add if not present, remove if present)
     */
    async toggleReaction(messageId, emoji) {
        const response = await this.transport.request({
            method: "POST",
            url: `/messages/${messageId}/reactions`,
            body: { emoji },
        });
        return response.data.reactions;
    }
}
//# sourceMappingURL=BaseMessagingClient.js.map