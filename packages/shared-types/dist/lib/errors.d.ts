import { ZodError } from "zod";
export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "INTERNAL_SERVER_ERROR" | "SERVICE_UNAVAILABLE" | "TIMEOUT" | "VALIDATION_ERROR" | "NETWORK_ERROR" | "UNKNOWN_ERROR";
export type ErrorSeverity = "info" | "warning" | "error" | "critical";
export interface DomainError {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    details?: Record<string, unknown>;
    timestamp: Date;
}
export interface ApiErrorResponse {
    error: string;
    message?: string;
    code?: string;
    errorCode?: string;
    name?: string;
    reason?: string;
    remainingMs?: number;
    details?: Record<string, unknown>;
}
export interface ValidationErrorDetails {
    field: string;
    message: string;
    value?: unknown;
}
export declare const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode>;
export declare const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number>;
export declare const ERROR_MESSAGES: Record<ErrorCode, string>;
export declare function zodErrorToApiError(error: ZodError): ApiErrorResponse;
//# sourceMappingURL=errors.d.ts.map