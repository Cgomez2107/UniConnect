import { useState, useCallback } from "react"
import { DIContainer } from "@/lib/services/di/container"
import { useUnreadCountStore } from "@/store/unreadCountStore"
import type { Message, Conversation } from "@/types"
import type { CreateMessagePayload } from "@/lib/services/domain/repositories/IMessageRepository"

interface PendingMessage {
  conversationId: string
  senderId: string
  payload: CreateMessagePayload
}

interface UseMessagingState {
  loading: boolean
  error: string | null
  conversations: Conversation[]
  messages: Message[]
}

export function useMessaging() {
  const container = DIContainer.getInstance()
  const [pendingByTempId, setPendingByTempId] = useState<Record<string, PendingMessage>>({})
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
        await useUnreadCountStore.getState().refreshUnreadCount()
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
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          messages: result.map((msg) => ({ ...msg, client_status: "sent", client_error: null })),
        }))
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
    async (conversationId: string, senderId: string, payload: string | CreateMessagePayload) => {
      const normalized =
        typeof payload === "string"
          ? { content: payload }
          : payload

      const tempId = `temp-${Date.now()}`
      const optimisticContent = normalized.content?.trim() ?? ""

      // Optimistic update
      const newMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: senderId,
        content: optimisticContent,
        media_url: normalized.media_url ?? null,
        media_type: normalized.media_type ?? null,
        media_filename: normalized.media_filename ?? null,
        reply_to_message_id: normalized.reply_to_message_id ?? null,
        reply_preview: normalized.reply_preview ?? null,
        client_status: "sending",
        client_error: null,
        created_at: new Date().toISOString(),
        read_at: null,
      }

      setPendingByTempId((prev) => ({
        ...prev,
        [tempId]: {
          conversationId,
          senderId,
          payload: normalized,
        },
      }))

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }))

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

      const isTransientError = (err: unknown): boolean => {
        const msg = err instanceof Error ? err.message.toLowerCase() : ""
        return (
          msg.includes("network") ||
          msg.includes("timeout") ||
          msg.includes("fetch") ||
          msg.includes("servidor") ||
          msg.includes("gateway") ||
          msg.includes("503") ||
          msg.includes("502")
        )
      }

      try {
        const useCase = container.getSendMessage()

        let attempts = 0
        let result: Message | null = null
        let lastError: unknown = null

        while (attempts < 2 && !result) {
          attempts += 1

          if (attempts > 1) {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === tempId ? { ...m, client_status: "retrying", client_error: null } : m
              ),
            }))
          }

          try {
            result = await useCase.execute(conversationId, senderId, normalized)
          } catch (err) {
            lastError = err
            if (attempts >= 2 || !isTransientError(err)) {
              throw err
            }
            await delay(1200)
          }
        }

        if (!result) {
          throw lastError instanceof Error ? lastError : new Error("No se pudo enviar el mensaje")
        }

        // Replace optimistic with real
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId ? { ...result, client_status: "sent", client_error: null } : m
          ),
        }))

        setPendingByTempId((prev) => {
          const { [tempId]: _, ...rest } = prev
          return rest
        })

        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al enviar mensaje"

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId
              ? { ...m, client_status: "failed", client_error: errorMsg }
              : m
          ),
          error: errorMsg,
        }))
        throw err
      }
    },
    [container]
  )

  const retryMessage = useCallback(
    async (tempId: string) => {
      const pending = pendingByTempId[tempId]
      if (!pending) {
        throw new Error("No hay datos para reintentar este mensaje")
      }

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === tempId ? { ...m, client_status: "retrying", client_error: null } : m
        ),
      }))

      try {
        const useCase = container.getSendMessage()
        const result = await useCase.execute(
          pending.conversationId,
          pending.senderId,
          pending.payload,
        )

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId ? { ...result, client_status: "sent", client_error: null } : m
          ),
        }))

        setPendingByTempId((prev) => {
          const { [tempId]: _, ...rest } = prev
          return rest
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al reenviar"
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId ? { ...m, client_status: "failed", client_error: errorMsg } : m
          ),
          error: errorMsg,
        }))
      }
    },
    [container, pendingByTempId]
  )

  const getOrCreateConversation = useCallback(
    async (participantA: string, participantB: string) => {
      try {
        const useCase = container.getGetOrCreateConversation()
        const conversation = await useCase.execute(participantA, participantB)
        return conversation
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al abrir conversación"
        setState((prev) => ({ ...prev, error: errorMsg }))
        throw err
      }
    },
    [container]
  )

  const handleMarkAsRead = useCallback(
    async (conversationId: string) => {
      try {
        const useCase = container.getMarkConversationAsRead()
        await useCase.execute(conversationId)

        // Total refetch strategy to keep badge in sync
        await useUnreadCountStore.getState().refreshUnreadCount()
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error al marcar como leído"
        setState((prev) => ({ ...prev, error: errorMsg }))
        // Don't throw - let the screen continue even if marking as read fails
        console.warn("handleMarkAsRead error:", errorMsg)
      }
    },
    [container]
  )

  return {
    ...state,
    getConversations,
    getMessages,
    sendMessage,
    retryMessage,
    getOrCreateConversation,
    handleMarkAsRead,
  }
}
