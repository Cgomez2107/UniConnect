import { z } from "zod";
import { BaseTransport } from "./ITransport.js";
import { ContractViolationError } from "../types/index.js";
/**
 * WebSocket client implementation using browser/node WebSocket
 */
export class FetchWebSocketClient {
    ws = null;
    url;
    options;
    handlers = new Map();
    reconnectCount = 0;
    maxReconnectAttempts;
    reconnectInterval;
    reconnectTimer = null;
    shouldReconnect = true;
    constructor(url, options) {
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
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                this.ws.onopen = () => {
                    this.reconnectCount = 0;
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        const { event: eventType, payload } = message;
                        if (eventType && this.handlers.has(eventType)) {
                            const handlers = this.handlers.get(eventType);
                            handlers.forEach((handler) => handler(payload));
                        }
                    }
                    catch (error) {
                        console.error("WebSocket message parse error:", error);
                    }
                };
                this.ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    reject(new Error("WebSocket connection failed"));
                };
                this.ws.onclose = () => {
                    if (this.shouldReconnect && this.options.reconnect) {
                        this.attemptReconnect();
                    }
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    attemptReconnect() {
        if (this.reconnectCount >= this.maxReconnectAttempts) {
            console.error("Max reconnect attempts reached");
            return;
        }
        this.reconnectCount++;
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(console.error);
        }, this.reconnectInterval * this.reconnectCount);
    }
    disconnect() {
        this.shouldReconnect = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    send(event, payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected");
            return;
        }
        this.ws.send(JSON.stringify({
            event,
            payload,
        }));
    }
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
        // Return unsubscribe function
        return () => {
            this.off(event, handler);
        };
    }
    off(event, handler) {
        if (this.handlers.has(event)) {
            this.handlers.get(event).delete(handler);
        }
    }
    isConnected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
    getReconnectCount() {
        return this.reconnectCount;
    }
}
/**
 * Fetch-based HTTP transport implementation
 * Works in browser and Node.js 18+ environments
 */
export class FetchTransport extends BaseTransport {
    refreshProvider = null;
    isRefreshing = false;
    refreshQueue = [];
    /**
     * Set token refresh provider (called when 401 is received)
     */
    setTokenRefreshProvider(provider) {
        this.refreshProvider = provider;
    }
    async request(options) {
        return this.executeWithRetry(options);
    }
    async executeWithRetry(options, hasRetried = false) {
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
            const rawData = await this.parseResponseBody(response);
            // Convert Headers to object (use forEach method which is well-typed)
            const headerRecord = {};
            response.headers.forEach((value, key) => {
                headerRecord[key] = value;
            });
            if (!response.ok) {
                const error = new Error(this.mapHttpStatusToError(response.status));
                error.status = response.status;
                error.response = {
                    status: response.status,
                    statusText: response.statusText,
                    data: rawData,
                    headers: headerRecord,
                };
                // On 401, attempt token refresh once
                if (response.status === 401 && !hasRetried && this.refreshProvider) {
                    return this.handleTokenRefresh(options);
                }
                if (response.status === 401 && this.onSessionExpired) {
                    this.onSessionExpired();
                }
                throw error;
            }
            const data = this.unwrapDataEnvelope(rawData);
            if (options.responseSchema) {
                this.validateResponse(options.method, options.url, data, options.responseSchema);
            }
            return {
                status: response.status,
                statusText: response.statusText,
                data,
                headers: headerRecord,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    const timeoutError = new Error("Request timeout");
                    timeoutError.originalError = error;
                    throw timeoutError;
                }
                throw error;
            }
            throw new Error("Unknown request error");
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async handleTokenRefresh(originalOptions) {
        // If already refreshing, queue this request
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.refreshQueue.push({ resolve, reject, options: originalOptions });
            });
        }
        this.isRefreshing = true;
        try {
            const newToken = await this.refreshProvider();
            if (!newToken) {
                this.isRefreshing = false;
                this.drainQueue(false);
                if (this.onSessionExpired)
                    this.onSessionExpired();
                throw new Error("Token refresh failed");
            }
            this.isRefreshing = false;
            this.drainQueue(true);
            // Retry the original request with the new token
            return this.executeWithRetry(originalOptions, true);
        }
        catch (error) {
            this.isRefreshing = false;
            this.drainQueue(false);
            throw error;
        }
    }
    drainQueue(success) {
        const queue = [...this.refreshQueue];
        this.refreshQueue = [];
        for (const item of queue) {
            if (success) {
                this.executeWithRetry(item.options, true)
                    .then((r) => item.resolve(r))
                    .catch((e) => item.reject(e));
            }
            else {
                item.reject(new Error("Session expired"));
            }
        }
    }
    getWebSocket(url, options) {
        return new FetchWebSocketClient(url, options);
    }
    async parseResponseBody(response) {
        if (response.status === 204) {
            return undefined;
        }
        const rawText = await response.text();
        if (!rawText) {
            return undefined;
        }
        try {
            return JSON.parse(rawText);
        }
        catch {
            return rawText;
        }
    }
    validateResponse(method, url, data, schema) {
        try {
            schema.parse(data);
        }
        catch (err) {
            if (err instanceof z.ZodError) {
                throw new ContractViolationError(method, url, err.issues);
            }
            throw err;
        }
    }
    unwrapDataEnvelope(payload) {
        if (payload === null || payload === undefined)
            return undefined;
        if (Array.isArray(payload))
            return payload;
        if (typeof payload === "object") {
            const obj = payload;
            if ("data" in obj) {
                return obj.data;
            }
        }
        return payload;
    }
}
//# sourceMappingURL=fetchTransport.js.map