/**
 * Códigos de error de validación de mensajes
 * Used in Chain of Responsibility pattern for message validation
 */
export var ValidationErrorCode;
(function (ValidationErrorCode) {
    // Size validation errors
    ValidationErrorCode["MESSAGE_EMPTY"] = "MESSAGE_EMPTY";
    ValidationErrorCode["MESSAGE_TOO_LONG"] = "MESSAGE_TOO_LONG";
    // Content validation errors
    ValidationErrorCode["FORBIDDEN_WORDS"] = "FORBIDDEN_WORDS";
    ValidationErrorCode["BANNED_CONTENT"] = "BANNED_CONTENT";
    ValidationErrorCode["SPAM_DETECTED"] = "SPAM_DETECTED";
    // Media validation errors
    ValidationErrorCode["UNSUPPORTED_FILE_TYPE"] = "UNSUPPORTED_FILE_TYPE";
    ValidationErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ValidationErrorCode["INVALID_FILENAME"] = "INVALID_FILENAME";
    ValidationErrorCode["FILENAME_TOO_LONG"] = "FILENAME_TOO_LONG";
    // Permission validation errors
    ValidationErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ValidationErrorCode["USER_BANNED_FROM_GROUP"] = "USER_BANNED_FROM_GROUP";
    ValidationErrorCode["GROUP_RESTRICTED"] = "GROUP_RESTRICTED";
    // Mention validation errors
    ValidationErrorCode["INVALID_MENTION"] = "INVALID_MENTION";
    ValidationErrorCode["MENTION_NOT_FOUND"] = "MENTION_NOT_FOUND";
    // Generic errors
    ValidationErrorCode["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    ValidationErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ValidationErrorCode || (ValidationErrorCode = {}));
/**
 * User-friendly error messages in Spanish
 */
export const ValidationErrorMessages = {
    [ValidationErrorCode.MESSAGE_EMPTY]: "El mensaje no puede estar vacío. Escribe algo o adjunta un archivo.",
    [ValidationErrorCode.MESSAGE_TOO_LONG]: "El mensaje es demasiado largo. Máximo 5000 caracteres.",
    [ValidationErrorCode.FORBIDDEN_WORDS]: "Tu mensaje contiene palabras prohibidas. Por favor, revísalo.",
    [ValidationErrorCode.BANNED_CONTENT]: "El contenido de tu mensaje no está permitido en este chat.",
    [ValidationErrorCode.SPAM_DETECTED]: "Se detectó comportamiento sospechoso. Intenta más tarde.",
    [ValidationErrorCode.UNSUPPORTED_FILE_TYPE]: "Este tipo de archivo no está soportado. Intenta con imágenes, PDFs o documentos.",
    [ValidationErrorCode.FILE_TOO_LARGE]: "El archivo es demasiado grande. Máximo 10 MB.",
    [ValidationErrorCode.INVALID_FILENAME]: "El nombre del archivo contiene caracteres no permitidos.",
    [ValidationErrorCode.FILENAME_TOO_LONG]: "El nombre del archivo es demasiado largo. Máximo 255 caracteres.",
    [ValidationErrorCode.INSUFFICIENT_PERMISSIONS]: "No tienes permisos para enviar mensajes en este chat.",
    [ValidationErrorCode.USER_BANNED_FROM_GROUP]: "Has sido bloqueado en este chat.",
    [ValidationErrorCode.GROUP_RESTRICTED]: "Este chat está temporalmente restringido.",
    [ValidationErrorCode.INVALID_MENTION]: "Menciona de usuarios no válida. Usa el autocomplete.",
    [ValidationErrorCode.MENTION_NOT_FOUND]: "El usuario mencionado no existe o no está disponible.",
    [ValidationErrorCode.VALIDATION_FAILED]: "La validación del mensaje falló. Intenta de nuevo.",
    [ValidationErrorCode.UNKNOWN_ERROR]: "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
};
/**
 * Validador: error que se lanza desde cada handler de la cadena
 */
export class ValidatorError extends Error {
    code;
    message;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.details = details;
        this.name = "ValidatorError";
        Object.setPrototypeOf(this, ValidatorError.prototype);
    }
    toJSON() {
        return {
            error: this.code,
            message: this.message,
            details: this.details,
        };
    }
}
//# sourceMappingURL=MessageValidationErrors.js.map