/**
 * Error Types
 * Standardized error structures for domain and API errors
 */
export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "INTERNAL_SERVER_ERROR" | "SERVICE_UNAVAILABLE" | "TIMEOUT" | "VALIDATION_ERROR" | "NETWORK_ERROR" | "UNKNOWN_ERROR";
export type ErrorSeverity = "info" | "warning" | "error" | "critical";
export interface DomainError {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    details?: Record<string, any>;
    timestamp: Date;
}
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    status: number;
    timestamp: string;
    path?: string;
}
export interface ValidationErrorDetails {
    field: string;
    message: string;
    value?: any;
}
export interface ValidationError extends DomainError {
    code: "VALIDATION_ERROR";
    details: {
        errors: ValidationErrorDetails[];
    };
}
export declare const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode>;
export declare const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number>;
export declare const ERROR_MESSAGES: Record<ErrorCode, string>;
//# sourceMappingURL=errors.d.ts.map