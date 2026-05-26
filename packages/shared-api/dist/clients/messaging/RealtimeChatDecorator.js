/**
 * Realtime Chat Decorator
 * Adds WebSocket realtime capabilities to BaseMessagingClient
 * Follows Decorator Pattern: wraps base client and adds orthogonal concerns
 */
import { mapResponseDtoToDomain } from "../../mappers/index.js";
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
export class RealtimeChatDecorator {
    baseClient;
    transport;
    wsUrl;
    ws = null;
    messageHandlers = new Set();
    typingHandlers = new Set();
    presenceHandlers = new Set();
    reconnectHandlers = new Set();
    isConnecting = false;
    subscriptions = new Map();
    constructor(baseClient, transport, wsUrl) {
        this.baseClient = baseClient;
        this.transport = transport;
        this.wsUrl = wsUrl;
    }
    /**
     * Initialize realtime connection
     * Called when component mounts or app initializes
     */
    async connect() {
        if (this.isConnecting || (this.ws && this.ws.isConnected())) {
            return;
        }
        this.isConnecting = true;
        try {
            this.ws = this.transport.getWebSocket(this.wsUrl, {
                reconnect: true,
                reconnectInterval: 3000,
                maxReconnectAttempts: 5,
            });
            await this.ws.connect();
            this.setupEventListeners();
            this.isConnecting = false;
        }
        catch (error) {
            console.error("Failed to connect realtime chat:", error);
            this.isConnecting = false;
            throw error;
        }
    }
    /**
     * Disconnect realtime connection
     */
    disconnect() {
        if (this.ws) {
            this.ws.disconnect();
            this.ws = null;
        }
        this.messageHandlers.clear();
        this.typingHandlers.clear();
        this.presenceHandlers.clear();
        this.subscriptions.clear();
    }
    /**
     * Setup internal event listeners
     */
    setupEventListeners() {
        if (!this.ws)
            return;
        // Listen for incoming messages
        this.ws.on("message", (data) => {
            // CRITICAL: Map snake_case payload to camelCase
            const mappedMessage = mapResponseDtoToDomain(data);
            this.messageHandlers.forEach((handler) => handler(mappedMessage));
        });
        // Listen for typing indicators
        this.ws.on("user:typing", (data) => {
            const mapped = mapResponseDtoToDomain(data);
            this.typingHandlers.forEach((handler) => handler(mapped));
        });
        // Listen for presence events (user online/offline)
        this.ws.on("user:presence", (data) => {
            const mapped = mapResponseDtoToDomain(data);
            this.presenceHandlers.forEach((handler) => handler(mapped));
        });
        // Listen for reconnection events
        this.ws.on("reconnected", () => {
            this.reconnectHandlers.forEach((handler) => handler({ reconnected: true }));
        });
        // Listen for custom events via subscriptions
        this.subscriptions.forEach((handlers, eventName) => {
            this.ws?.on(eventName, (data) => {
                const mapped = mapResponseDtoToDomain(data);
                handlers.forEach((handler) => handler(mapped));
            });
        });
    }
    /**
     * Subscribe to incoming messages
     */
    onMessage(handler) {
        this.messageHandlers.add(handler);
        return {
            unsubscribe: () => this.messageHandlers.delete(handler),
        };
    }
    /**
     * Subscribe to typing indicators
     */
    onTyping(handler) {
        this.typingHandlers.add(handler);
        return {
            unsubscribe: () => this.typingHandlers.delete(handler),
        };
    }
    /**
     * Subscribe to presence events
     */
    onPresence(handler) {
        this.presenceHandlers.add(handler);
        return {
            unsubscribe: () => this.presenceHandlers.delete(handler),
        };
    }
    /**
     * Subscribe to reconnection events
     */
    onReconnect(handler) {
        this.reconnectHandlers.add(handler);
        return {
            unsubscribe: () => this.reconnectHandlers.delete(handler),
        };
    }
    /**
     * Subscribe to custom event type
     * Enables flexible event handling beyond predefined types
     */
    on(eventName, handler) {
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, new Set());
            // Setup listener if already connected
            if (this.ws && this.ws.isConnected()) {
                this.ws.on(eventName, (data) => {
                    const mapped = mapResponseDtoToDomain(data);
                    const handlers = this.subscriptions.get(eventName);
                    handlers?.forEach((h) => h(mapped));
                });
            }
        }
        this.subscriptions.get(eventName)?.add(handler);
        return {
            unsubscribe: () => {
                const handlers = this.subscriptions.get(eventName);
                handlers?.delete(handler);
            },
        };
    }
    /**
     * Emit typing indicator (user is typing)
     */
    sendTyping(conversationId) {
        if (!this.ws || !this.ws.isConnected()) {
            console.warn("WebSocket not connected, cannot send typing indicator");
            return;
        }
        this.ws.send("user:typing", {
            conversation_id: conversationId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emit stop typing indicator
     */
    sendStopTyping(conversationId) {
        if (!this.ws || !this.ws.isConnected()) {
            return;
        }
        this.ws.send("user:stop-typing", {
            conversation_id: conversationId,
        });
    }
    /**
     * Broadcast presence (online/offline/away)
     */
    setPresence(status) {
        if (!this.ws || !this.ws.isConnected()) {
            console.warn("WebSocket not connected, cannot set presence");
            return;
        }
        this.ws.send("user:presence", {
            status,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Check if realtime connection is active
     */
    isConnected() {
        return this.ws !== null && this.ws.isConnected();
    }
    /**
     * Get current reconnection attempt count
     */
    getReconnectCount() {
        return this.ws?.getReconnectCount() ?? 0;
    }
    /**
     * CRITICAL: All base client methods are still available
     * This decorator is transparent to callers - they can use base client methods
     * Example:
     *   const decorator = new RealtimeChatDecorator(baseClient, transport, wsUrl);
     *   await decorator.baseClient.getConversations();  // ← Base client method
     *   decorator.onMessage((msg) => {});               // ← Decorator method
     */
    getBaseClient() {
        return this.baseClient;
    }
}
//# sourceMappingURL=RealtimeChatDecorator.js.map