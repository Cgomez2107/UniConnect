import { ValidationErrorCode } from "./MessageValidationErrors";
/**
 * Resultado de la validación de un mensaje
 * Retornado por la cadena de responsabilidad (Chain of Responsibility)
 */
export interface ValidationResult {
    isValid: boolean;
    errorCode?: ValidationErrorCode;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    warnings?: ValidationWarning[];
    suggestions?: string[];
}
/**
 * Advertencia de validación (no bloquea, pero informa al usuario)
 */
export interface ValidationWarning {
    type: "length" | "mentions" | "suspicious" | "file" | "content";
    message: string;
    severity: "info" | "warning";
}
/**
 * Estado de validación para el UI
 * Usado en hooks de validación en cliente
 */
export interface ValidationState {
    isValidating: boolean;
    isValid: boolean;
    error?: {
        code: ValidationErrorCode;
        message: string;
        details?: Record<string, unknown>;
    };
    warnings?: ValidationWarning[];
    suggestions?: string[];
    lastValidatedAt?: Date;
}
/**
 * Metadata de validación
 * Información adicional que necesitan los validadores
 */
export interface ValidationMetadata {
    conversationId?: string;
    userId?: string;
    mediaUrl?: string;
    mediaType?: string;
    mediaFilename?: string;
    replyToId?: string;
    mentions?: string[];
    groupId?: string;
    [key: string]: unknown;
}
/**
 * Factory para crear ValidationResult exitoso
 */
export declare function createSuccessResult(): ValidationResult;
/**
 * Factory para crear ValidationResult fallido
 */
export declare function createErrorResult(code: ValidationErrorCode, message: string, details?: Record<string, unknown>): ValidationResult;
/**
 * Factory para crear ValidationResult con advertencias
 */
export declare function createWarningResult(warnings: ValidationWarning[]): ValidationResult;
//# sourceMappingURL=ValidationResult.d.ts.map