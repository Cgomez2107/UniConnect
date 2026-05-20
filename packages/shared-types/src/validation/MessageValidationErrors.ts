/**
 * Códigos de error de validación de mensajes
 * Used in Chain of Responsibility pattern for message validation
 */

export enum ValidationErrorCode {
  // Size validation errors
  MESSAGE_EMPTY = "MESSAGE_EMPTY",
  MESSAGE_TOO_LONG = "MESSAGE_TOO_LONG",

  // Content validation errors
  FORBIDDEN_WORDS = "FORBIDDEN_WORDS",
  BANNED_CONTENT = "BANNED_CONTENT",
  SPAM_DETECTED = "SPAM_DETECTED",

  // Media validation errors
  UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILENAME = "INVALID_FILENAME",
  FILENAME_TOO_LONG = "FILENAME_TOO_LONG",

  // Permission validation errors
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  USER_BANNED_FROM_GROUP = "USER_BANNED_FROM_GROUP",
  GROUP_RESTRICTED = "GROUP_RESTRICTED",

  // Mention validation errors
  INVALID_MENTION = "INVALID_MENTION",
  MENTION_NOT_FOUND = "MENTION_NOT_FOUND",

  // Generic errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * User-friendly error messages in Spanish
 */
export const ValidationErrorMessages: Record<ValidationErrorCode, string> = {
  [ValidationErrorCode.MESSAGE_EMPTY]:
    "El mensaje no puede estar vacío. Escribe algo o adjunta un archivo.",
  [ValidationErrorCode.MESSAGE_TOO_LONG]:
    "El mensaje es demasiado largo. Máximo 5000 caracteres.",

  [ValidationErrorCode.FORBIDDEN_WORDS]:
    "Tu mensaje contiene palabras prohibidas. Por favor, revísalo.",
  [ValidationErrorCode.BANNED_CONTENT]:
    "El contenido de tu mensaje no está permitido en este chat.",
  [ValidationErrorCode.SPAM_DETECTED]:
    "Se detectó comportamiento sospechoso. Intenta más tarde.",

  [ValidationErrorCode.UNSUPPORTED_FILE_TYPE]:
    "Este tipo de archivo no está soportado. Intenta con imágenes, PDFs o documentos.",
  [ValidationErrorCode.FILE_TOO_LARGE]:
    "El archivo es demasiado grande. Máximo 10 MB.",
  [ValidationErrorCode.INVALID_FILENAME]:
    "El nombre del archivo contiene caracteres no permitidos.",
  [ValidationErrorCode.FILENAME_TOO_LONG]:
    "El nombre del archivo es demasiado largo. Máximo 255 caracteres.",

  [ValidationErrorCode.INSUFFICIENT_PERMISSIONS]:
    "No tienes permisos para enviar mensajes en este chat.",
  [ValidationErrorCode.USER_BANNED_FROM_GROUP]:
    "Has sido bloqueado en este chat.",
  [ValidationErrorCode.GROUP_RESTRICTED]:
    "Este chat está temporalmente restringido.",

  [ValidationErrorCode.INVALID_MENTION]:
    "Menciona de usuarios no válida. Usa el autocomplete.",
  [ValidationErrorCode.MENTION_NOT_FOUND]:
    "El usuario mencionado no existe o no está disponible.",

  [ValidationErrorCode.VALIDATION_FAILED]:
    "La validación del mensaje falló. Intenta de nuevo.",
  [ValidationErrorCode.UNKNOWN_ERROR]:
    "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
};

/**
 * Validador: error que se lanza desde cada handler de la cadena
 */
export class ValidatorError extends Error {
  constructor(
    public code: ValidationErrorCode,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
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
