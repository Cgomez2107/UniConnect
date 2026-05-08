import { create } from "zustand";
import type { Message as MessageApi, Conversation as ConversationApi } from "@/types";
import type { MessageUI, ConversationUI } from "@/types/ui";

interface ConversationsStore {
  conversations: ConversationUI[];
  currentConversation: ConversationUI | null;
  messages: MessageUI[];
  isLoading: boolean;

  setConversations: (conversations: ConversationUI[]) => void;
  setCurrentConversation: (conversation: ConversationUI) => void;
  addMessage: (message: MessageUI) => void;
  setMessages: (messages: MessageUI[]) => void;
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
