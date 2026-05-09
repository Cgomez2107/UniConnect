import { BaseTransport } from "./ITransport.js";
import type {
  RequestOptions,
  ResponseData,
  TransportError,
  IWebSocketClient,
  WebSocketOptions,
} from "../types/index.js";

/**
 * WebSocket client implementation using browser/node WebSocket
 */
export class FetchWebSocketClient implements IWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketOptions;
  private handlers: Map<string, Set<(payload: any) => void>> = new Map();
  private reconnectCount: number = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect: boolean = true;

  constructor(url: string, options?: WebSocketOptions) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    };
    this.maxReconnectAttempts = this.options.maxReconnectAttempts || 5;
    this.reconnectInterval = this.options.reconnectInterval || 3000;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectCount = 0;
          resolve();
        };

        this.ws.onmessage = (event: Event) => {
          try {
            const message = JSON.parse((event as MessageEvent).data);
            const { event: eventType, payload } = message;

            if (eventType && this.handlers.has(eventType)) {
              const handlers = this.handlers.get(eventType)!;
              handlers.forEach((handler) => handler(payload));
            }
          } catch (error) {
            console.error("WebSocket message parse error:", error);
          }
        };

        this.ws.onerror = (error: Event) => {
          console.error("WebSocket error:", error);
          reject(new Error("WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          if (this.shouldReconnect && this.options.reconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectCount >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectCount++;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(console.error);
    }, this.reconnectInterval * this.reconnectCount);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(event: string, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    this.ws.send(
      JSON.stringify({
        event,
        payload,
      })
    );
  }

  on(event: string, handler: (payload: any) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  off(event: string, handler: (payload: any) => void): void {
    if (this.handlers.has(event)) {
      this.handlers.get(event)!.delete(handler);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getReconnectCount(): number {
    return this.reconnectCount;
  }
}

/**
 * Fetch-based HTTP transport implementation
 * Works in browser and Node.js 18+ environments
 */
export class FetchTransport extends BaseTransport {
  async request<TResponse = any>(
    options: RequestOptions
  ): Promise<ResponseData<TResponse>> {
    const { method, url, headers = {}, body, params, timeout } = options;

    const fullUrl = this.buildUrl(url, params);
    const authHeaders = await this.getAuthHeader();
    const finalHeaders = {
      "Content-Type": "application/json",
      ...headers,
      ...authHeaders,
    };

    const controller = new AbortController();
    const timeoutMs = timeout || this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = (await response.json()) as TResponse;

      // Convert Headers to object (use forEach method which is well-typed)
      const headerRecord: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headerRecord[key] = value;
      });

      if (!response.ok) {
        const error: TransportError = new Error(
          this.mapHttpStatusToError(response.status)
        );
        error.status = response.status;
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: headerRecord,
        };
        throw error;
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: headerRecord,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          const timeoutError: TransportError = new Error("Request timeout");
          timeoutError.originalError = error;
          throw timeoutError;
        }
        throw error;
      }
      throw new Error("Unknown request error");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getWebSocket(
    url: string,
    options?: WebSocketOptions
  ): IWebSocketClient {
    return new FetchWebSocketClient(url, options);
  }
}
