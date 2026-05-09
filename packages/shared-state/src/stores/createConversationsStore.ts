/**
 * Conversations Store Factory
 * Creates Zustand conversations store with dependency injection
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";

export interface ConversationsState {
  // State
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Map<string, Message[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConversations(): Promise<void>;
  selectConversation(conversationId: string): Promise<void>;
  loadMessages(conversationId: string, limit?: number): Promise<void>;
  addMessage(conversationId: string, message: Message): void;
  updateMessage(conversationId: string, message: Message): void;
  deleteMessage(conversationId: string, messageId: string): void;
  createConversation(conversationId: string, conversation: Conversation): void;
  setError(error: string | null): void;
  hydrate(): Promise<void>;
}

/**
 * Factory function - creates a new conversations store instance
 */
export function createConversationsStore(deps: StoreDeps) {
  const { apiClients, storage, logger } = deps;

  return create<ConversationsState>()(
    persist(
      (set, get) => ({
        // Initial state
        conversations: [],
        currentConversationId: null,
        messages: new Map(),
        isLoading: false,
        error: null,

        // Load all conversations
        async loadConversations(): Promise<void> {
          try {
            set({ isLoading: true, error: null });
            logger?.info("Loading conversations");

            const conversations = await apiClients.messaging.getConversations({
              limit: 50,
            });

            set({
              conversations,
              isLoading: false,
            });

            logger?.info(`Loaded ${conversations.length} conversations`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to load conversations";
            set({ error: errorMessage, isLoading: false });
            logger?.error(`Load conversations error: ${errorMessage}`);
            throw error;
          }
        },

        // Select and load specific conversation
        async selectConversation(conversationId: string): Promise<void> {
          try {
            set({
              currentConversationId: conversationId,
              isLoading: true,
              error: null,
            });

            logger?.info(`Selecting conversation: ${conversationId}`);

            // Load messages if not already loaded
            const current = get();
            if (!current.messages.has(conversationId)) {
              await get().loadMessages(conversationId);
            }

            set({ isLoading: false });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to select conversation";
            set({ error: errorMessage, isLoading: false });
            logger?.error(`Select conversation error: ${errorMessage}`);
            throw error;
          }
        },

        // Load messages for a conversation
        async loadMessages(conversationId: string, limit: number = 50): Promise<void> {
          try {
            logger?.info(`Loading messages for conversation: ${conversationId}`);

            const messages = await apiClients.messaging.getMessages({
              conversationId,
              limit,
            });

            set((state) => {
              const newMessages = new Map(state.messages);
              newMessages.set(conversationId, messages);
              return { messages: newMessages };
            });

            logger?.info(`Loaded ${messages.length} messages`);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to load messages";
            logger?.error(`Load messages error: ${errorMessage}`);
            throw error;
          }
        },

        // Add message to conversation
        addMessage(conversationId: string, message: Message): void {
          set((state) => {
            const newMessages = new Map(state.messages);
            const current = (newMessages.get(conversationId) ?? []) as Message[];
            newMessages.set(conversationId, [...current, message]);

            // Update conversation's lastMessage
            const conversations = state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: message,
                    lastMessageAt: message.createdAt,
                    messageCount: conv.messageCount + 1,
                  }
                : conv
            );

            return { messages: newMessages, conversations };
          });

          logger?.info(`Message added to ${conversationId}: ${message.id}`);
        },

        // Update message in conversation
        updateMessage(conversationId: string, message: Message): void {
          set((state) => {
            const newMessages = new Map(state.messages);
            const current = (newMessages.get(conversationId) ?? []) as Message[];
            newMessages.set(
              conversationId,
              current.map((m) => (m.id === message.id ? message : m))
            );
            return { messages: newMessages };
          });

          logger?.info(`Message updated in ${conversationId}: ${message.id}`);
        },

        // Delete message from conversation
        deleteMessage(conversationId: string, messageId: string): void {
          set((state) => {
            const newMessages = new Map(state.messages);
            const current = (newMessages.get(conversationId) ?? []) as Message[];
            newMessages.set(
              conversationId,
              current.filter((m) => m.id !== messageId)
            );
            return { messages: newMessages };
          });

          logger?.info(`Message deleted from ${conversationId}: ${messageId}`);
        },

        // Create new conversation locally
        createConversation(conversationId: string, conversation: Conversation): void {
          set((state) => ({
            conversations: [conversation, ...state.conversations],
          }));

          logger?.info(`Conversation created: ${conversationId}`);
        },

        // Set error
        setError(error: string | null): void {
          set({ error });
        },

        // Hydrate from storage
        async hydrate(): Promise<void> {
          try {
            const storedConversations = await storage.getItem(
              "conversations:list"
            );

            if (storedConversations) {
              const conversations: Conversation[] = JSON.parse(storedConversations);
              set({ conversations });
              logger?.info(`Hydrated ${conversations.length} conversations`);
            }

            const storedMessages = await storage.getItem("conversations:messages");
            if (storedMessages) {
              const messagesObj: Record<string, Message[]> = JSON.parse(
                storedMessages
              );
              const messages = new Map(Object.entries(messagesObj));
              set({ messages });
              logger?.info(
                `Hydrated messages for ${messages.size} conversations`
              );
            }
          } catch (error) {
            logger?.error("Error hydrating conversations:", error);
          }
        },
      }),
      {
        name: "conversations:store",
        storage: {
          getItem: async (name) => {
            const item = await storage.getItem(name);
            return item ? JSON.parse(item) : null;
          },
          setItem: async (name, value) => {
            // Handle Map serialization for messages
            const stateData = (value as any).state;
            if (stateData?.messages instanceof Map) {
              const serialized = {
                ...value,
                state: {
                  ...stateData,
                  messages: Object.fromEntries(stateData.messages),
                },
              };
              await storage.setItem(name, JSON.stringify(serialized));
            } else {
              await storage.setItem(name, JSON.stringify(value));
            }
          },
          removeItem: async (name) => {
            await storage.removeItem(name);
          },
        },
        partialize: (state: any) => ({
          conversations: state.conversations,
          messages: Object.fromEntries(state.messages),
        }),
      }
    )
  );
}
