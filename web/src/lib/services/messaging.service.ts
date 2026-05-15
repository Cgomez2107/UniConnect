import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Conversation as ConversationApi, Message as MessageApi, SendMessagePayload } from "@/types";
import { mapConversationApiToUI, mapMessageApiToUI } from "@/utils/mappers";
import type { ConversationUI, MessageUI } from "@/types/ui";

const messagingService = {
  async getConversations(): Promise<ConversationUI[]> {
    try {
      const response = await apiClient.get<{ data: ConversationApi[] }>(
        API_ENDPOINTS.CONVERSATIONS_LIST
      );
      return response.data.data.map(mapConversationApiToUI);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  async getConversationById(id: string): Promise<ConversationUI> {
    try {
      const response = await apiClient.get<{ data: ConversationApi }>(
        API_ENDPOINTS.CONVERSATIONS_BY_ID(id)
      );
      return mapConversationApiToUI(response.data.data);
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      throw error;
    }
  },

  async createConversation(participantId: string): Promise<ConversationUI> {
    try {
      const response = await apiClient.post<{ data: ConversationApi }>(
        API_ENDPOINTS.CONVERSATIONS_CREATE,
        { participant_id: participantId }
      );
      return mapConversationApiToUI(response.data.data);
    } catch (error) {
      console.error(
        `Error creating conversation with ${participantId}:`,
        error
      );
      throw error;
    }
  },

  async getMessages(conversationId: string): Promise<MessageUI[]> {
    try {
      const response = await apiClient.get<{ data: MessageApi[] }>(
        API_ENDPOINTS.MESSAGES_LIST,
        { params: { conversationId } }
      );
      return response.data.data.map(mapMessageApiToUI);
    } catch (error) {
      console.error(
        `Error fetching messages for conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  },

  async sendMessage(
    conversationId: string,
    content: string,
    options?: { replyToMessageId?: string; mediaUrl?: string; mediaType?: string }
  ): Promise<MessageUI> {
    try {
      const payload: any = {
        conversationId,
        content,
      };
      if (options?.replyToMessageId) payload.reply_to_message_id = options.replyToMessageId;
      if (options?.mediaUrl) payload.media_url = options.mediaUrl;
      if (options?.mediaType) payload.media_type = options.mediaType;
      const response = await apiClient.post<{ data: MessageApi }>(
        API_ENDPOINTS.MESSAGES_SEND,
        payload
      );
      return mapMessageApiToUI(response.data.data as MessageApi);
    } catch (error) {
      console.error(
        `Error sending message to conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.patch(
        API_ENDPOINTS.CONVERSATIONS_MARK_READ(conversationId)
      );
    } catch (error) {
      console.error(
        `Error marking conversation ${conversationId} as read:`,
        error
      );
      throw error;
    }
  },
};

export default messagingService;
