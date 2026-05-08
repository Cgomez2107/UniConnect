import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Conversation as ConversationApi, Message as MessageApi, SendMessagePayload } from "@/types";
import { mapConversationApiToUI, mapMessageApiToUI } from "@/utils/mappers";
import type { ConversationUI, MessageUI } from "@/types/ui";

/**
 * Servicio de mensajería y conversaciones
 */
const messagingService = {
  /**
   * Obtiene todas las conversaciones del usuario autenticado
   */
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

  /**
   * Obtiene los detalles de una conversación por ID
   */
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

  /**
   * Crea una nueva conversación con un participante
   */
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

  /**
   * Obtiene todos los mensajes de una conversación
   */
  async getMessages(conversationId: string): Promise<MessageUI[]> {
    try {
      const response = await apiClient.get<{ data: MessageApi[] }>(
        API_ENDPOINTS.MESSAGES_LIST(conversationId)
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

  /**
   * Envía un mensaje a una conversación
   */
  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<MessageUI> {
    try {
      const payload: SendMessagePayload = {
        conversation_id: conversationId,
        content,
      };
      const response = await apiClient.post<{ data: MessageApi }>(
        API_ENDPOINTS.MESSAGES_SEND(conversationId),
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

  /**
   * Marca una conversación como leída
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.patch(
        `/conversations/${conversationId}/mark-as-read`
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
