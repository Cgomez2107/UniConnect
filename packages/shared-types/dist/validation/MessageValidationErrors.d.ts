/**
 * Códigos de error de validación de mensajes
 * Used in Chain of Responsibility pattern for message validation
 */
export declare enum ValidationErrorCode {
    MESSAGE_EMPTY = "MESSAGE_EMPTY",
    MESSAGE_TOO_LONG = "MESSAGE_TOO_LONG",
    FORBIDDEN_WORDS = "FORBIDDEN_WORDS",
    BANNED_CONTENT = "BANNED_CONTENT",
    SPAM_DETECTED = "SPAM_DETECTED",
    ESCALATED_TO_ADMIN = "ESCALATED_TO_ADMIN",
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    INVALID_FILENAME = "INVALID_FILENAME",
    FILENAME_TOO_LONG = "FILENAME_TOO_LONG",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    USER_BANNED_FROM_GROUP = "USER_BANNED_FROM_GROUP",
    GROUP_RESTRICTED = "GROUP_RESTRICTED",
    INVALID_MENTION = "INVALID_MENTION",
    MENTION_NOT_FOUND = "MENTION_NOT_FOUND",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * User-friendly error messages in Spanish
 */
export declare const ValidationErrorMessages: Record<ValidationErrorCode, string>;
/**
 * Validador: error que se lanza desde cada handler de la cadena
 */
export type ModerationErrorCode = "MO_001" | "MO_002" | "MO_003" | "MO_004";
export declare class ValidatorError extends Error {
    code: ValidationErrorCode;
    message: string;
    details?: Record<string, unknown> | undefined;
    constructor(code: ValidationErrorCode, message: string, details?: Record<string, unknown> | undefined);
    toJSON(): {
        error: ValidationErrorCode;
        message: string;
        details: Record<string, unknown> | undefined;
    };
}
//# sourceMappingURL=MessageValidationErrors.d.ts.map