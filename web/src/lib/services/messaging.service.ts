import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Conversation, Message, SendMessagePayload } from "@/types";

/**
 * Servicio de mensajería y conversaciones
 */
const messagingService = {
  /**
   * Obtiene todas las conversaciones del usuario autenticado
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<{ data: Conversation[] }>(
        API_ENDPOINTS.CONVERSATIONS_LIST
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  /**
   * Obtiene los detalles de una conversación por ID
   */
  async getConversationById(id: string): Promise<Conversation> {
    try {
      const response = await apiClient.get<{ data: Conversation }>(
        API_ENDPOINTS.CONVERSATIONS_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva conversación con un participante
   */
  async createConversation(participantId: string): Promise<Conversation> {
    try {
      const response = await apiClient.post<{ data: Conversation }>(
        API_ENDPOINTS.CONVERSATIONS_CREATE,
        { participant_id: participantId }
      );
      return response.data.data;
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
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await apiClient.get<{ data: Message[] }>(
        API_ENDPOINTS.MESSAGES_LIST(conversationId)
      );
      return response.data.data;
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
  ): Promise<Message> {
    try {
      const payload: SendMessagePayload = {
        conversation_id: conversationId,
        content,
      };
      const response = await apiClient.post<{ data: Message }>(
        API_ENDPOINTS.MESSAGES_SEND(conversationId),
        payload
      );
      return response.data.data;
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
