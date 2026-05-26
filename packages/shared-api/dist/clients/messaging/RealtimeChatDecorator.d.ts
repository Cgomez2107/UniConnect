/**
 * Realtime Chat Decorator
 * Adds WebSocket realtime capabilities to BaseMessagingClient
 * Follows Decorator Pattern: wraps base client and adds orthogonal concerns
 */
import type { ITransport } from "../../transport/index.js";
import { BaseMessagingClient } from "./BaseMessagingClient.js";
export type RealtimeEventHandler = (data: any) => void;
export interface RealtimeEventSubscription {
    unsubscribe: () => void;
}
/**
 * Realtime Chat Decorator
 *
 * PATTERN: Decorator (Object Structural Pattern)
 * - Wraps BaseMessagingClient instance
 * - Adds WebSocket realtime capabilities without modifying base client
 * - Maintains same public interface as base client
 * - Respects Open/Closed Principle: open for extension, closed for modification
 *
 * Key responsibilities:
 * 1. Maintain WebSocket connection to realtime server
 * 2. Listen for incoming messages, typing indicators, presence events
 * 3. Transform all incoming data through mappers (snake_case → camelCase)
 * 4. Emit events to subscribers
 * 5. Handle reconnection with backoff strategy
 */
export declare class RealtimeChatDecorator {
    private baseClient;
    private transport;
    private wsUrl;
    private ws;
    private messageHandlers;
    private typingHandlers;
    private presenceHandlers;
    private reconnectHandlers;
    private isConnecting;
    private subscriptions;
    constructor(baseClient: BaseMessagingClient, transport: ITransport, wsUrl: string);
    /**
     * Initialize realtime connection
     * Called when component mounts or app initializes
     */
    connect(): Promise<void>;
    /**
     * Disconnect realtime connection
     */
    disconnect(): void;
    /**
     * Setup internal event listeners
     */
    private setupEventListeners;
    /**
     * Subscribe to incoming messages
     */
    onMessage(handler: RealtimeEventHandler): RealtimeEventSubscription;
    /**
     * Subscribe to typing indicators
     */
    onTyping(handler: RealtimeEventHandler): RealtimeEventSubscription;
    /**
     * Subscribe to presence events
     */
    onPresence(handler: RealtimeEventHandler): RealtimeEventSubscription;
    /**
     * Subscribe to reconnection events
     */
    onReconnect(handler: RealtimeEventHandler): RealtimeEventSubscription;
    /**
     * Subscribe to custom event type
     * Enables flexible event handling beyond predefined types
     */
    on(eventName: string, handler: RealtimeEventHandler): RealtimeEventSubscription;
    /**
     * Emit typing indicator (user is typing)
     */
    sendTyping(conversationId: string): void;
    /**
     * Emit stop typing indicator
     */
    sendStopTyping(conversationId: string): void;
    /**
     * Broadcast presence (online/offline/away)
     */
    setPresence(status: "online" | "offline" | "away"): void;
    /**
     * Check if realtime connection is active
     */
    isConnected(): boolean;
    /**
     * Get current reconnection attempt count
     */
    getReconnectCount(): number;
    /**
     * CRITICAL: All base client methods are still available
     * This decorator is transparent to callers - they can use base client methods
     * Example:
     *   const decorator = new RealtimeChatDecorator(baseClient, transport, wsUrl);
     *   await decorator.baseClient.getConversations();  // ← Base client method
     *   decorator.onMessage((msg) => {});               // ← Decorator method
     */
    getBaseClient(): BaseMessagingClient;
}
//# sourceMappingURL=RealtimeChatDecorator.d.ts.map