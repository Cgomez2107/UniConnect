import { useState, useCallback } from "react"
import { DIContainer } from "@/lib/services/di/container"
import type { Message, Conversation } from "@/types"

interface UseMessagingState {
  loading: boolean
  error: string | null
  conversations: Conversation[]
  messages: Message[]
}

export function useMessaging() {
  const container = DIContainer.getInstance()
  const [state, setState] = useState<UseMessagingState>({
    loading: false,
    error: null,
    conversations: [],
    messages: [],
  })

  const getConversations = useCallback(
    async (userId: string) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getGetConversations()
        const result = await useCase.execute(userId)
        setState((prev) => ({ ...prev, loading: false, error: null, conversations: result }))
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al cargar conversaciones"
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getMessages = useCallback(
    async (conversationId: string, limit = 50, offset = 0) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const useCase = container.getGetMessages()
        const result = await useCase.execute(conversationId, limit, offset)
        setState((prev) => ({ ...prev, loading: false, error: null, messages: result }))
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al cargar mensajes"
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const sendMessage = useCallback(
    async (conversationId: string, senderId: string, content: string) => {
      // Optimistic update
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }))

      try {
        const useCase = container.getSendMessage()
        const result = await useCase.execute(conversationId, senderId, content)

        // Replace optimistic with real
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) => (m.id.startsWith("temp-") ? result : m)),
        }))

        return result
      } catch (err) {
        // Rollback optimistic update
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => !m.id.startsWith("temp-")),
        }))

        const errorMsg = err instanceof Error ? err.message : "Error al enviar mensaje"
        setState((prev) => ({ ...prev, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const getOrCreateConversation = useCallback(
    async (participantA: string, participantB: string) => {
      try {
        const repository = container.getConversationRepository()
        const conversation = await repository.getOrCreate(participantA, participantB)
        return conversation
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al abrir conversación"
        setState((prev) => ({ ...prev, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  return {
    ...state,
    getConversations,
    getMessages,
    sendMessage,
    getOrCreateConversation,
  }
}
