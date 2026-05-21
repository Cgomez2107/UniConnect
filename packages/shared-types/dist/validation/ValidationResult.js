/**
 * Factory para crear ValidationResult exitoso
 */
export function createSuccessResult() {
    return {
        isValid: true,
        suggestions: [],
    };
}
/**
 * Factory para crear ValidationResult fallido
 */
export function createErrorResult(code, message, details) {
    return {
        isValid: false,
        errorCode: code,
        errorMessage: message,
        errorDetails: details,
        suggestions: [],
    };
}
/**
 * Factory para crear ValidationResult con advertencias
 */
export function createWarningResult(warnings) {
    return {
        isValid: true,
        warnings,
        suggestions: [],
    };
}
//# sourceMappingURL=ValidationResult.js.map