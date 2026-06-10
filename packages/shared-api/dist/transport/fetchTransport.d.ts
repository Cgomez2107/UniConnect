import { BaseTransport } from "./ITransport.js";
import type { RequestOptions, ResponseData, IWebSocketClient, WebSocketOptions } from "../types/index.js";
/**
 * WebSocket client implementation using browser/node WebSocket
 */
export declare class FetchWebSocketClient implements IWebSocketClient {
    private ws;
    private url;
    private options;
    private handlers;
    private reconnectCount;
    private maxReconnectAttempts;
    private reconnectInterval;
    private reconnectTimer;
    private shouldReconnect;
    constructor(url: string, options?: WebSocketOptions);
    connect(): Promise<void>;
    private attemptReconnect;
    disconnect(): void;
    send(event: string, payload: any): void;
    on(event: string, handler: (payload: any) => void): () => void;
    off(event: string, handler: (payload: any) => void): void;
    isConnected(): boolean;
    getReconnectCount(): number;
}
/**
 * Fetch-based HTTP transport implementation
 * Works in browser and Node.js 18+ environments
 */
export declare class FetchTransport extends BaseTransport {
    private refreshProvider;
    private isRefreshing;
    private refreshQueue;
    /**
     * Set token refresh provider (called when 401 is received)
     */
    setTokenRefreshProvider(provider: () => Promise<string | null>): void;
    /**
     * Set error callback (invoked on any error response)
     */
    setOnError(callback: ((error: {
        status: number;
        data: any;
    }) => void) | null): void;
    request<TResponse = any>(options: RequestOptions): Promise<ResponseData<TResponse>>;
    private executeWithRetry;
    private handleTokenRefresh;
    private drainQueue;
    getWebSocket(url: string, options?: WebSocketOptions): IWebSocketClient;
    private parseResponseBody;
    private validateResponse;
    private unwrapDataEnvelope;
}
//# sourceMappingURL=fetchTransport.d.ts.map