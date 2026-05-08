import { create } from "zustand";
import type { Message, Conversation } from "@/types";

interface ConversationsStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;

  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (loading: boolean) => void;
  clearCurrentConversation: () => void;
}

export const useConversationsStore = create<ConversationsStore>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  clearCurrentConversation: () =>
    set({ currentConversation: null, messages: [] }),
}));

export default useConversationsStore;
