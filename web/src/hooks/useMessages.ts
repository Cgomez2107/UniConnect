import { useState, useCallback } from "react";
import { MessageUI } from "@/types/ui";
import messagingService from "@/lib/services/messaging.service";

interface UseMessagesState {
  messages: MessageUI[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar mensajes de una conversación
 *
 * @returns {Object} Estado y métodos de mensajes
 * @returns {Message[]} messages - Lista de mensajes
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} loadMessages - Carga los mensajes de una conversación
 * @returns {Function} sendMessage - Envía un nuevo mensaje
 * @returns {Function} markAsRead - Marca un mensaje como leído
 *
 * @example
 * const { messages, sendMessage } = useMessages();
 * await loadMessages(conversationId);
 * await sendMessage(conversationId, "Hola!");
 */
export default function useMessages() {
  const [state, setState] = useState<UseMessagesState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const loadMessages = useCallback(async (conversationId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await messagingService.getMessages(conversationId);
      setState({ messages: data, isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando mensajes";
      console.error("Error loading messages:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const message = await messagingService.sendMessage(
          conversationId,
          content
        );
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
          isLoading: false,
        }));
        return message;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error enviando mensaje";
        console.error("Error sending message:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      // Este método requeriría un endpoint en el backend
      // Por ahora es un placeholder
      console.log(`Marking conversation ${conversationId} as read`);
    } catch (err) {
      console.error("Error marking as read:", err);
      throw err;
    }
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    loadMessages,
    sendMessage,
    markAsRead,
  };
}
