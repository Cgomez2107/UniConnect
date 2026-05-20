import { ValidationErrorCode } from "@uniconnect/shared-types";

/**
 * Mapea errores del patrón Chain of Responsibility a códigos de error estandarizados
 * Usado por el gateway y servicios para retornar respuestas consistentes
 *
 * Este mapper es el punto central donde se unifican todos los errores de validación
 */
export class ValidationErrorMapper {
  /**
   * Mapeo de clase de error (nombre) a código de error
   */
  private static readonly errorClassToCode: Record<string, ValidationErrorCode> =
    {
      SizeError: ValidationErrorCode.MESSAGE_TOO_LONG,
      ContentError: ValidationErrorCode.BANNED_CONTENT,
      MediaError: ValidationErrorCode.UNSUPPORTED_FILE_TYPE,
      PermissionError: ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
      MentionError: ValidationErrorCode.INVALID_MENTION,
      ValidationError: ValidationErrorCode.VALIDATION_FAILED,
    };

  /**
   * Mapea una excepción de validador a un código de error estandarizado
   */
  static mapError(error: Error): ValidationErrorCode {
    const errorName = error.name || error.constructor.name;

    // Intentar mapeo directo por clase
    const mappedCode = this.errorClassToCode[errorName];
    if (mappedCode) {
      return mappedCode;
    }

    // Intentar mapeo por mensaje
    const message = error.message.toLowerCase();

    if (message.includes("empty")) {
      return ValidationErrorCode.MESSAGE_EMPTY;
    }
    if (
      message.includes("long") ||
      message.includes("length") ||
      message.includes("exceeded")
    ) {
      return ValidationErrorCode.MESSAGE_TOO_LONG;
    }
    if (message.includes("forbidden") || message.includes("banned")) {
      return ValidationErrorCode.BANNED_CONTENT;
    }
    if (message.includes("unsupported") || message.includes("file type")) {
      return ValidationErrorCode.UNSUPPORTED_FILE_TYPE;
    }
    if (message.includes("file") && message.includes("large")) {
      return ValidationErrorCode.FILE_TOO_LARGE;
    }
    if (message.includes("filename")) {
      return ValidationErrorCode.INVALID_FILENAME;
    }
    if (message.includes("permission") || message.includes("unauthorized")) {
      return ValidationErrorCode.INSUFFICIENT_PERMISSIONS;
    }
    if (message.includes("banned") && message.includes("group")) {
      return ValidationErrorCode.USER_BANNED_FROM_GROUP;
    }
    if (message.includes("mention")) {
      return ValidationErrorCode.INVALID_MENTION;
    }
    if (message.includes("spam")) {
      return ValidationErrorCode.SPAM_DETECTED;
    }

    // Default fallback
    return ValidationErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Retorna el código de error y el mensaje de usuario apropiado
   * Usado para respuestas HTTP consistentes
   */
  static getErrorResponse(
    error: Error
  ): { code: ValidationErrorCode; message: string } {
    const code = this.mapError(error);

    // Importar mensajes de usuario friendly
    const { ValidationErrorMessages } = require("@uniconnect/shared-types");

    return {
      code,
      message: ValidationErrorMessages[code] || error.message,
    };
  }

  /**
   * Convierte un error de validación a respuesta HTTP
   */
  static toHttpResponse(error: Error) {
    const { code, message } = this.getErrorResponse(error);
    const frontendCode = this.getFrontendErrorCode(code);
    const frontendMessage = this.getFrontendMessage(code, message);

    return {
      statusCode: this.getHttpStatus(code),
      body: {
        error: frontendCode,
        message: frontendMessage,
      },
    };
  }

  private static getFrontendErrorCode(code: ValidationErrorCode): string {
    switch (code) {
      case ValidationErrorCode.MESSAGE_TOO_LONG:
        return "MSG_LIMIT_EXCEEDED";
      case ValidationErrorCode.BANNED_CONTENT:
        return "BANNED_CONTENT";
      case ValidationErrorCode.FILE_TOO_LARGE:
        return "FILE_TOO_LARGE";
      default:
        return code;
    }
  }

  private static getFrontendMessage(
    code: ValidationErrorCode,
    fallbackMessage: string
  ): string {
    switch (code) {
      case ValidationErrorCode.MESSAGE_TOO_LONG:
        return "El mensaje excede el límite de caracteres";
      case ValidationErrorCode.BANNED_CONTENT:
        return "El mensaje contiene contenido no permitido";
      case ValidationErrorCode.FILE_TOO_LARGE:
        return "El archivo excede el tamaño máximo de 50MB";
      default:
        return fallbackMessage;
    }
  }

  /**
   * Retorna el código HTTP apropiado para un código de error de validación
   */
  static getHttpStatus(code: ValidationErrorCode): number {
    // 400 Bad Request - errores de validación del cliente
    const badRequestErrors = [
      ValidationErrorCode.MESSAGE_EMPTY,
      ValidationErrorCode.MESSAGE_TOO_LONG,
      ValidationErrorCode.UNSUPPORTED_FILE_TYPE,
      ValidationErrorCode.FILE_TOO_LARGE,
      ValidationErrorCode.INVALID_FILENAME,
      ValidationErrorCode.FILENAME_TOO_LONG,
      ValidationErrorCode.FORBIDDEN_WORDS,
      ValidationErrorCode.BANNED_CONTENT,
      ValidationErrorCode.INVALID_MENTION,
    ];

    if (badRequestErrors.includes(code)) {
      return 400;
    }

    // 403 Forbidden - errores de permisos
    const forbiddenErrors = [
      ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
      ValidationErrorCode.USER_BANNED_FROM_GROUP,
      ValidationErrorCode.GROUP_RESTRICTED,
    ];

    if (forbiddenErrors.includes(code)) {
      return 403;
    }

    // 404 Not Found
    const notFoundErrors = [ValidationErrorCode.MENTION_NOT_FOUND];

    if (notFoundErrors.includes(code)) {
      return 404;
    }

    // 429 Too Many Requests
    if (code === ValidationErrorCode.SPAM_DETECTED) {
      return 429;
    }

    // 500 Internal Server Error - fallback
    return 500;
  }
}
