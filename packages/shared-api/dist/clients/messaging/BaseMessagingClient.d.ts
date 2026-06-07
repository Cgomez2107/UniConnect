/**
 * Base Messaging Client
 * HTTP-only client for messaging operations
 * Does NOT include WebSocket realtime logic (delegated to Decorator)
 */
import type { ITransport } from "../../transport/index.js";
import type { Conversation, Message } from "@uniconnect/shared-types";
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
    poll?: {
        question: string;
        options: Array<{
            text: string;
            votes: string[];
        }>;
        isOpen: boolean;
        closesAt: string | null;
        createdAt: string;
    };
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
export declare class BaseMessagingClient {
    private transport;
    constructor(transport: ITransport);
    /**
     * Get all conversations for current user
     */
    getConversations(params?: GetConversationsParams): Promise<Conversation[]>;
    /**
     * Get single conversation by ID
     */
    getConversation(conversationId: string): Promise<Conversation>;
    /**
     * Create or get a direct conversation with another user
     */
    createConversation(participantB: string): Promise<Conversation>;
    /**
     * Get messages in a conversation
     */
    getMessages(params: GetMessagesParams): Promise<Message[]>;
    /**
     * Send message via HTTP (for non-realtime or when socket unavailable)
     */
    sendMessage(payload: SendMessagePayload): Promise<Message>;
    /**
     * Mark conversation as read
     */
    markConversationAsRead(conversationId: string): Promise<void>;
    /**
     * Get unread messages count
     */
    getUnreadCount(): Promise<number>;
    /**
     * Toggle a reaction on a message (add if not present, remove if present)
     */
    toggleReaction(messageId: string, emoji: string): Promise<{
        emoji: string;
        userId: string;
    }[]>;
}
//# sourceMappingURL=BaseMessagingClient.d.ts.map