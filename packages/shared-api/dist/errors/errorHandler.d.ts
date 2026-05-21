export type ErrorType = "GROUP_FULL" | "INVALID_TRANSITION" | "ADMIN_TRANSFER_PENDING" | "UNAUTHORIZED" | "NOT_FOUND" | "SERVER_ERROR" | "NETWORK_ERROR" | "UNKNOWN";
export interface ErrorMessage {
    title: string;
    message: string;
    type: "error" | "warning" | "info";
}
export declare function parseBackendError(error: unknown): ErrorType;
export declare function getErrorMessage(errorType: ErrorType, context?: string): ErrorMessage;
export declare function showErrorAlert(error: unknown, context?: string): void;
//# sourceMappingURL=errorHandler.d.ts.map