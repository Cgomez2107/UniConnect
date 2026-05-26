import type { StoreDeps } from "../types/index.js";
export interface UnreadCountState {
    conversationUnreadCounts: Record<string, number>;
    totalUnread: number;
    setConversationUnread(conversationId: string, count: number): void;
    incrementUnread(conversationId: string): void;
    decrementUnread(conversationId: string): void;
    clearConversationUnread(conversationId: string): void;
    recalculateTotal(): void;
}
export declare function createUnreadCountStore(deps: Pick<StoreDeps, "logger">): import("zustand").UseBoundStore<import("zustand").StoreApi<UnreadCountState>>;
//# sourceMappingURL=createUnreadCountStore.d.ts.map