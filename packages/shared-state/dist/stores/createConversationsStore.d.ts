/**
 * Conversations Store Factory
 * Creates Zustand conversations store with dependency injection
 */
import type { Conversation, Message } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";
export interface ConversationsState {
    conversations: Conversation[];
    currentConversationId: string | null;
    messages: Map<string, Message[]>;
    isLoading: boolean;
    error: string | null;
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
export declare function createConversationsStore(deps: StoreDeps): import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ConversationsState>, "setState" | "persist"> & {
    setState(partial: ConversationsState | Partial<ConversationsState> | ((state: ConversationsState) => ConversationsState | Partial<ConversationsState>), replace?: false | undefined): unknown;
    setState(state: ConversationsState | ((state: ConversationsState) => ConversationsState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ConversationsState, {
            conversations: any;
            messages: {
                [k: string]: any;
            };
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ConversationsState) => void) => () => void;
        onFinishHydration: (fn: (state: ConversationsState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ConversationsState, {
            conversations: any;
            messages: {
                [k: string]: any;
            };
        }, unknown>>;
    };
}>;
//# sourceMappingURL=createConversationsStore.d.ts.map