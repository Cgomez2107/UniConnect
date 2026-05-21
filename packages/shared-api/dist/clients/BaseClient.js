export const DEFAULT_RETRY_CONFIG = {
    maxRetries: 2,
    delays: [1000, 3000],
    retryableErrorPatterns: [/ENOTFOUND/, /getaddrinfo/i, /EAI_AGAIN/, /eai_again/i],
};
const HTTP_STATUS_TO_ERROR_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    500: "INTERNAL_SERVER_ERROR",
    503: "SERVICE_UNAVAILABLE",
};
const ERROR_MESSAGES = {
    UNAUTHORIZED: "Autenticación requerida. Por favor inicia sesión.",
    FORBIDDEN: "No tienes permisos para acceder a este recurso.",
    NOT_FOUND: "El recurso solicitado no fue encontrado.",
    BAD_REQUEST: "La solicitud contiene datos inválidos.",
    CONFLICT: "La operación entra en conflicto con los datos existentes.",
    INTERNAL_SERVER_ERROR: "Error interno del servidor. Por favor intenta más tarde.",
    SERVICE_UNAVAILABLE: "El servicio no está disponible en este momento.",
    TIMEOUT: "La solicitud tardó demasiado tiempo. Por favor intenta nuevamente.",
    VALIDATION_ERROR: "Los datos proporcionados no son válidos.",
    NETWORK_ERROR: "Error de conexión. Verifica tu conexión a internet.",
    UNKNOWN_ERROR: "Ocurrió un error inesperado.",
};
export class BaseClient {
    config;
    constructor(config = DEFAULT_RETRY_CONFIG) {
        this.config = config;
    }
    ensureArray(data) {
        if (Array.isArray(data))
            return data;
        if (data && typeof data === "object" && !Array.isArray(data)) {
            const obj = data;
            if (Array.isArray(obj.rows))
                return obj.rows;
            if (Array.isArray(obj.items))
                return obj.items;
            if (Array.isArray(obj.data))
                return obj.data;
        }
        return [];
    }
    async request(fn) {
        let lastError;
        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < this.config.maxRetries && this.isRetryable(error)) {
                    await this.delay(this.config.delays[attempt]);
                    continue;
                }
                throw this.mapError(error);
            }
        }
        throw this.mapError(lastError);
    }
    isRetryable(error) {
        if (this.isDnsError(error))
            return true;
        if (this.isRetryableHttp(this.getHttpStatus(error)))
            return true;
        if (this.isNetworkError(error))
            return true;
        return false;
    }
    isDnsError(error) {
        if (!(error instanceof Error))
            return false;
        const message = error.message ?? "";
        return this.config.retryableErrorPatterns.some((pattern) => pattern.test(message));
    }
    isNetworkError(error) {
        if (!(error instanceof Error))
            return false;
        const message = error.message ?? "";
        return /fetch|network|connect|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ERR_CONN/i.test(message) &&
            !this.isDnsError(error);
    }
    isRetryableHttp(status) {
        if (status === undefined)
            return false;
        return status >= 500 && status <= 599;
    }
    getHttpStatus(error) {
        if (error && typeof error === "object" && "status" in error) {
            return error.status;
        }
        if (error && typeof error === "object" && "response" in error) {
            const resp = error.response;
            return resp?.status;
        }
        return undefined;
    }
    mapError(error) {
        const timestamp = new Date();
        if (this.isDnsError(error)) {
            return {
                code: "SERVICE_UNAVAILABLE",
                message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
                severity: "warning",
                details: { original: error instanceof Error ? error.message : String(error) },
                timestamp,
            };
        }
        if (this.isNetworkError(error)) {
            return {
                code: "NETWORK_ERROR",
                message: ERROR_MESSAGES.NETWORK_ERROR,
                severity: "warning",
                details: { original: error instanceof Error ? error.message : String(error) },
                timestamp,
            };
        }
        const status = this.getHttpStatus(error);
        if (status && status in HTTP_STATUS_TO_ERROR_CODE) {
            const code = HTTP_STATUS_TO_ERROR_CODE[status];
            return {
                code,
                message: ERROR_MESSAGES[code],
                severity: code === "UNAUTHORIZED" ? "error" : "error",
                details: { status, original: error instanceof Error ? error.message : String(error) },
                timestamp,
            };
        }
        return {
            code: "UNKNOWN_ERROR",
            message: ERROR_MESSAGES.UNKNOWN_ERROR,
            severity: "error",
            details: { original: error instanceof Error ? error.message : String(error) },
            timestamp,
        };
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=BaseClient.js.map