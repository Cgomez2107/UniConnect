import { useState, useCallback, useEffect } from "react";
import { Conversation, Message } from "@/types";
import messagingService from "@/lib/services/messaging.service";
import { useConversationsStore } from "@/store/useConversationsStore";

interface UseConversationsState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar conversaciones y mensajes
 *
 * @returns {Object} Estado y métodos de conversaciones
 * @returns {Conversation[]} conversations - Lista de conversaciones
 * @returns {Conversation|null} currentConversation - Conversación actual seleccionada
 * @returns {Message[]} messages - Mensajes de la conversación actual
 * @returns {boolean} loading - Estado de carga
 * @returns {string|null} error - Mensaje de error
 * @returns {Function} loadConversations - Carga las conversaciones
 * @returns {Function} selectConversation - Selecciona una conversación
 * @returns {Function} sendMessage - Envía un mensaje
 * @returns {Function} refresh - Recarga las conversaciones
 *
 * @example
 * const { conversations, currentConversation, sendMessage } = useConversations();
 * await loadConversations();
 * await sendMessage("Hola, cómo estás?");
 */
export default function useConversations() {
  const store = useConversationsStore();
  const [state, setState] = useState<UseConversationsState>({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
  });

  const loadConversations = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await messagingService.getConversations();
      setState((prev) => ({
        ...prev,
        conversations: data,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando conversaciones";
      console.error("Error loading conversations:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const conversation =
          await messagingService.getConversationById(conversationId);
        const messages = await messagingService.getMessages(conversationId);
        setState((prev) => ({
          ...prev,
          currentConversation: conversation,
          messages,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error cargando conversación";
        console.error("Error selecting conversation:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.currentConversation) {
        throw new Error("No hay conversación seleccionada");
      }

      try {
        const message = await messagingService.sendMessage(
          state.currentConversation.id,
          content
        );
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
        return message;
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [state.currentConversation]
  );

  const refresh = useCallback(() => {
    return loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    loadConversations,
    selectConversation,
    sendMessage,
    refresh,
  };
}
