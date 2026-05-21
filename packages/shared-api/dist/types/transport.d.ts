/**
 * Transport Layer Types
 * Abstractions for HTTP and WebSocket communication
 */
import type { z } from "zod";
export interface RequestOptions {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    url: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string | number | boolean>;
    timeout?: number;
    responseSchema?: z.ZodTypeAny;
}
export interface ResponseData<T = any> {
    status: number;
    statusText: string;
    data: T;
    headers: Record<string, string>;
}
export interface TransportError extends Error {
    status?: number;
    response?: ResponseData;
    originalError?: Error;
}
export declare class ContractViolationError extends Error {
    readonly method: string;
    readonly url: string;
    readonly zodIssues: import("zod").ZodIssue[];
    constructor(method: string, url: string, zodIssues: import("zod").ZodIssue[]);
}
export interface ITransport {
    /**
     * Execute HTTP request
     */
    request<TResponse = any>(options: RequestOptions): Promise<ResponseData<TResponse>>;
    /**
     * Set auth provider callback (injected token)
     */
    setAuthProvider(provider: () => Promise<string | null>): void;
    /**
     * Set token refresh provider (called on 401 to attempt refresh)
     */
    setTokenRefreshProvider?(provider: () => Promise<string | null>): void;
    /**
     * Set session expiration callback (invoked when refresh fails)
     */
    setOnSessionExpired?(callback: (() => void) | null): void;
    /**
     * Get WebSocket client
     */
    getWebSocket(url: string, options?: WebSocketOptions): IWebSocketClient;
}
export interface WebSocketOptions {
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    headers?: Record<string, string>;
}
export interface IWebSocketClient {
    connect(): Promise<void>;
    disconnect(): void;
    send(event: string, payload: any): void;
    on(event: string, handler: (payload: any) => void): () => void;
    off(event: string, handler: (payload: any) => void): void;
    isConnected(): boolean;
    getReconnectCount(): number;
}
export type AuthProvider = () => Promise<string | null>;
//# sourceMappingURL=transport.d.ts.map