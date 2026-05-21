import type { ITransport, RequestOptions, ResponseData, TransportError, AuthProvider, IWebSocketClient, WebSocketOptions } from "../types/index.js";
export { ITransport, RequestOptions, ResponseData, TransportError, IWebSocketClient };
/**
 * Base abstract transport class
 * Provides common functionality for HTTP transport implementations
 */
export declare abstract class BaseTransport implements ITransport {
    protected authProvider: AuthProvider | null;
    protected baseURL: string;
    protected defaultTimeout: number;
    protected onSessionExpired: (() => void) | null;
    constructor(baseURL?: string);
    /**
     * Set session expiration callback (invoked on 401 responses)
     */
    setOnSessionExpired(callback: (() => void) | null): void;
    /**
     * Execute HTTP request
     * To be implemented by subclasses
     */
    abstract request<TResponse = any>(options: RequestOptions): Promise<ResponseData<TResponse>>;
    /**
     * Get WebSocket client
     * To be implemented by subclasses
     */
    abstract getWebSocket(url: string, options?: WebSocketOptions): IWebSocketClient;
    /**
     * Set auth provider callback
     */
    setAuthProvider(provider: AuthProvider): void;
    /**
     * Get authorization header
     * Helper method for subclasses
     */
    protected getAuthHeader(): Promise<Record<string, string>>;
    /**
     * Build full URL
     * Helper method for subclasses
     */
    protected buildUrl(url: string, params?: Record<string, string | number | boolean>): string;
    /**
     * Map HTTP status to error
     */
    protected mapHttpStatusToError(status: number): string;
}
//# sourceMappingURL=ITransport.d.ts.map