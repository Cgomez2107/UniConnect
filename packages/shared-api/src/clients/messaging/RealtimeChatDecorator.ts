/**
 * Realtime Chat Decorator
 * Adds WebSocket realtime capabilities to BaseMessagingClient
 * Follows Decorator Pattern: wraps base client and adds orthogonal concerns
 */

import type { ITransport, IWebSocketClient } from "../../transport/index.js";
import { mapMessageDtoToDomain, mapResponseDtoToDomain } from "../../mappers/index.js";
import { BaseMessagingClient } from "./BaseMessagingClient.js";
import type { Message } from "@uniconnect/shared-types";

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
export class RealtimeChatDecorator {
  private ws: IWebSocketClient | null = null;
  private messageHandlers: Set<RealtimeEventHandler> = new Set();
  private typingHandlers: Set<RealtimeEventHandler> = new Set();
  private presenceHandlers: Set<RealtimeEventHandler> = new Set();
  private reconnectHandlers: Set<RealtimeEventHandler> = new Set();
  private isConnecting: boolean = false;
  private subscriptions: Map<string, Set<RealtimeEventHandler>> = new Map();

  constructor(
    private baseClient: BaseMessagingClient,
    private transport: ITransport,
    private wsUrl: string
  ) {}

  /**
   * Initialize realtime connection
   * Called when component mounts or app initializes
   */
  async connect(): Promise<void> {
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
    } catch (error) {
      console.error("Failed to connect realtime chat:", error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect realtime connection
   */
  disconnect(): void {
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
  private setupEventListeners(): void {
    if (!this.ws) return;

    // Listen for incoming messages
    this.ws.on("message", (data: any) => {
      // CRITICAL: Map snake_case payload to camelCase
      const mappedMessage = mapResponseDtoToDomain(data);
      this.messageHandlers.forEach((handler) => handler(mappedMessage));
    });

    // Listen for typing indicators
    this.ws.on("user:typing", (data: any) => {
      const mapped = mapResponseDtoToDomain(data);
      this.typingHandlers.forEach((handler) => handler(mapped));
    });

    // Listen for presence events (user online/offline)
    this.ws.on("user:presence", (data: any) => {
      const mapped = mapResponseDtoToDomain(data);
      this.presenceHandlers.forEach((handler) => handler(mapped));
    });

    // Listen for reconnection events
    this.ws.on("reconnected", () => {
      this.reconnectHandlers.forEach((handler) => handler({ reconnected: true }));
    });

    // Listen for custom events via subscriptions
    this.subscriptions.forEach((handlers, eventName) => {
      this.ws?.on(eventName, (data: any) => {
        const mapped = mapResponseDtoToDomain(data);
        handlers.forEach((handler) => handler(mapped));
      });
    });
  }

  /**
   * Subscribe to incoming messages
   */
  onMessage(handler: RealtimeEventHandler): RealtimeEventSubscription {
    this.messageHandlers.add(handler);
    return {
      unsubscribe: () => this.messageHandlers.delete(handler),
    };
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(handler: RealtimeEventHandler): RealtimeEventSubscription {
    this.typingHandlers.add(handler);
    return {
      unsubscribe: () => this.typingHandlers.delete(handler),
    };
  }

  /**
   * Subscribe to presence events
   */
  onPresence(handler: RealtimeEventHandler): RealtimeEventSubscription {
    this.presenceHandlers.add(handler);
    return {
      unsubscribe: () => this.presenceHandlers.delete(handler),
    };
  }

  /**
   * Subscribe to reconnection events
   */
  onReconnect(handler: RealtimeEventHandler): RealtimeEventSubscription {
    this.reconnectHandlers.add(handler);
    return {
      unsubscribe: () => this.reconnectHandlers.delete(handler),
    };
  }

  /**
   * Subscribe to custom event type
   * Enables flexible event handling beyond predefined types
   */
  on(eventName: string, handler: RealtimeEventHandler): RealtimeEventSubscription {
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
  sendTyping(conversationId: string): void {
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
  sendStopTyping(conversationId: string): void {
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
  setPresence(status: "online" | "offline" | "away"): void {
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
  isConnected(): boolean {
    return this.ws !== null && this.ws.isConnected();
  }

  /**
   * Get current reconnection attempt count
   */
  getReconnectCount(): number {
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
  getBaseClient(): BaseMessagingClient {
    return this.baseClient;
  }
}
