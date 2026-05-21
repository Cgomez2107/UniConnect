/**
 * Error Types
 * Standardized error structures for domain and API errors
 */
// HTTP Status Codes mapped to ErrorCodes
export const HTTP_STATUS_TO_ERROR_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    500: "INTERNAL_SERVER_ERROR",
    503: "SERVICE_UNAVAILABLE",
    408: "TIMEOUT",
};
export const ERROR_CODE_TO_HTTP_STATUS = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    TIMEOUT: 408,
    VALIDATION_ERROR: 400,
    NETWORK_ERROR: 0,
    UNKNOWN_ERROR: 500,
};
export const ERROR_MESSAGES = {
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
//# sourceMappingURL=errors.js.map