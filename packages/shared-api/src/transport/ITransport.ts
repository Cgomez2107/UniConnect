import type {
  ITransport,
  RequestOptions,
  ResponseData,
  TransportError,
  AuthProvider,
  IWebSocketClient,
  WebSocketOptions,
} from "../types/index.js";

export { ITransport, RequestOptions, ResponseData, TransportError, IWebSocketClient };

/**
 * Base abstract transport class
 * Provides common functionality for HTTP transport implementations
 */
export abstract class BaseTransport implements ITransport {
  protected authProvider: AuthProvider | null = null;
  protected baseURL: string;
  protected defaultTimeout: number = 30000; // 30 seconds
  protected onSessionExpired: (() => void) | null = null;
  public onError: ((error: { status: number; data: any }) => void) | null = null;

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
  }

  /**
   * Set session expiration callback (invoked on 401 responses)
   */
  setOnSessionExpired(callback: (() => void) | null): void {
    this.onSessionExpired = callback;
  }

  /**
   * Set error callback (invoked on any error response)
   */
  setOnError(callback: ((error: { status: number; data: any }) => void) | null): void {
    this.onError = callback;
  }

  /**
   * Execute HTTP request
   * To be implemented by subclasses
   */
  abstract request<TResponse = any>(
    options: RequestOptions
  ): Promise<ResponseData<TResponse>>;

  /**
   * Get WebSocket client
   * To be implemented by subclasses
   */
  abstract getWebSocket(
    url: string,
    options?: WebSocketOptions
  ): IWebSocketClient;

  /**
   * Set auth provider callback
   */
  setAuthProvider(provider: AuthProvider): void {
    this.authProvider = provider;
  }

  /**
   * Get authorization header
   * Helper method for subclasses
   */
  protected async getAuthHeader(): Promise<Record<string, string>> {
    if (!this.authProvider) {
      return {};
    }

    const token = await this.authProvider();
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Build full URL
   * Helper method for subclasses
   */
  protected buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    let fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    if (params) {
      const queryString = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryString.append(key, String(value));
        }
      });

      const queryStr = queryString.toString();
      if (queryStr) {
        fullUrl += `?${queryStr}`;
      }
    }

    return fullUrl;
  }

  /**
   * Map HTTP status to error
   */
  protected mapHttpStatusToError(status: number): string {
    const statusMap: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      500: "Internal Server Error",
      503: "Service Unavailable",
    };
    return statusMap[status] || `HTTP Error ${status}`;
  }
}
