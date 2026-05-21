/**
 * Base abstract transport class
 * Provides common functionality for HTTP transport implementations
 */
export class BaseTransport {
    authProvider = null;
    baseURL;
    defaultTimeout = 30000; // 30 seconds
    onSessionExpired = null;
    constructor(baseURL = "") {
        this.baseURL = baseURL;
    }
    /**
     * Set session expiration callback (invoked on 401 responses)
     */
    setOnSessionExpired(callback) {
        this.onSessionExpired = callback;
    }
    /**
     * Set auth provider callback
     */
    setAuthProvider(provider) {
        this.authProvider = provider;
    }
    /**
     * Get authorization header
     * Helper method for subclasses
     */
    async getAuthHeader() {
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
    buildUrl(url, params) {
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
    mapHttpStatusToError(status) {
        const statusMap = {
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
//# sourceMappingURL=ITransport.js.map