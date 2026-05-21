import { z } from "zod";
import { BaseTransport } from "./ITransport.js";
import type {
  RequestOptions,
  ResponseData,
  TransportError,
  IWebSocketClient,
  WebSocketOptions,
} from "../types/index.js";
import { ContractViolationError } from "../types/index.js";

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
  private refreshProvider: (() => Promise<string | null>) | null = null;
  private isRefreshing: boolean = false;
  private refreshQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    options: RequestOptions;
  }> = [];

  /**
   * Set token refresh provider (called when 401 is received)
   */
  setTokenRefreshProvider(provider: () => Promise<string | null>): void {
    this.refreshProvider = provider;
  }

  async request<TResponse = any>(
    options: RequestOptions
  ): Promise<ResponseData<TResponse>> {
    return this.executeWithRetry<TResponse>(options);
  }

  private async executeWithRetry<TResponse>(
    options: RequestOptions,
    hasRetried: boolean = false
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

      const rawData = await this.parseResponseBody<TResponse>(response);

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
          data: rawData as TResponse,
          headers: headerRecord,
        };

        // On 401, attempt token refresh once
        if (response.status === 401 && !hasRetried && this.refreshProvider) {
          return this.handleTokenRefresh<TResponse>(options);
        }

        if (response.status === 401 && this.onSessionExpired) {
          this.onSessionExpired();
        }

        throw error;
      }

      const data = this.unwrapDataEnvelope<TResponse>(rawData);

      if (options.responseSchema) {
        this.validateResponse(options.method, options.url, data, options.responseSchema);
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

  private async handleTokenRefresh<TResponse>(
    originalOptions: RequestOptions
  ): Promise<ResponseData<TResponse>> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise<ResponseData<TResponse>>((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject, options: originalOptions });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.refreshProvider!();
      if (!newToken) {
        this.isRefreshing = false;
        this.drainQueue(false);
        if (this.onSessionExpired) this.onSessionExpired();
        throw new Error("Token refresh failed");
      }

      this.isRefreshing = false;
      this.drainQueue(true);
      // Retry the original request with the new token
      return this.executeWithRetry<TResponse>(originalOptions, true);
    } catch (error) {
      this.isRefreshing = false;
      this.drainQueue(false);
      throw error;
    }
  }

  private drainQueue(success: boolean): void {
    const queue = [...this.refreshQueue];
    this.refreshQueue = [];
    for (const item of queue) {
      if (success) {
        this.executeWithRetry(item.options, true)
          .then((r) => item.resolve(r))
          .catch((e) => item.reject(e));
      } else {
        item.reject(new Error("Session expired"));
      }
    }
  }

  getWebSocket(
    url: string,
    options?: WebSocketOptions
  ): IWebSocketClient {
    return new FetchWebSocketClient(url, options);
  }

  private async parseResponseBody<TResponse>(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const rawText = await response.text();
    if (!rawText) {
      return undefined;
    }

    try {
      return JSON.parse(rawText) as TResponse;
    } catch {
      return rawText;
    }
  }

  private validateResponse(
    method: string,
    url: string,
    data: unknown,
    schema: z.ZodTypeAny,
  ): void {
    try {
      schema.parse(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new ContractViolationError(method, url, err.issues);
      }
      throw err;
    }
  }

  private unwrapDataEnvelope<TResponse>(payload: unknown): TResponse {
    if (payload === null || payload === undefined) return undefined as TResponse;

    if (Array.isArray(payload)) return payload as TResponse;

    if (typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if ("data" in obj) {
        return obj.data as TResponse;
      }
    }

    return payload as TResponse;
  }
}
