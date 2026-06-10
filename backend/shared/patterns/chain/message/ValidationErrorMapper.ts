import { ValidationErrorCode } from "@uniconnect/shared-types";

export class ValidationErrorMapper {
  private static readonly errorClassToCode: Record<string, ValidationErrorCode> = {
    SizeError: ValidationErrorCode.MESSAGE_TOO_LONG,
    ContentError: ValidationErrorCode.BANNED_CONTENT,
    MediaError: ValidationErrorCode.UNSUPPORTED_FILE_TYPE,
    PermissionError: ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
    MentionError: ValidationErrorCode.INVALID_MENTION,
    ValidationError: ValidationErrorCode.VALIDATION_FAILED,
    MO_001: ValidationErrorCode.MESSAGE_TOO_LONG,
    MO_002: ValidationErrorCode.BANNED_CONTENT,
    MO_003: ValidationErrorCode.SPAM_DETECTED,
    MO_004: ValidationErrorCode.ESCALATED_TO_ADMIN,
  };

  static fromCodigoError(codigoError: string, mensajeError: string) {
    const code = this.errorClassToCode[codigoError] ?? ValidationErrorCode.VALIDATION_FAILED;

    return {
      statusCode: this.getHttpStatus(code),
      body: {
        error: codigoError.startsWith("MO_") ? codigoError : this.getFrontendErrorCode(code),
        message: codigoError.startsWith("MO_") ? mensajeError : this.getFrontendMessage(code, mensajeError),
      },
    };
  }

  static mapError(error: Error): ValidationErrorCode {
    const errorName = error.name || error.constructor.name;

    const mappedCode = this.errorClassToCode[errorName];
    if (mappedCode) {
      return mappedCode;
    }

    const message = error.message.toLowerCase();

    if (message.includes("empty")) {
      return ValidationErrorCode.MESSAGE_EMPTY;
    }
    if (message.includes("long") || message.includes("length") || message.includes("exceeded")) {
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
    if (message.includes("escalado") || message.includes("escalated") || message.includes("revisión humana")) {
      return ValidationErrorCode.ESCALATED_TO_ADMIN;
    }

    return ValidationErrorCode.UNKNOWN_ERROR;
  }

  static getErrorResponse(error: Error): { code: ValidationErrorCode; message: string } {
    const code = this.mapError(error);
    const { ValidationErrorMessages } = require("@uniconnect/shared-types");
    return {
      code,
      message: ValidationErrorMessages[code] || error.message,
    };
  }

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

  private static getFrontendMessage(code: ValidationErrorCode, fallbackMessage: string): string {
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

  static getHttpStatus(code: ValidationErrorCode): number {
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

    const forbiddenErrors = [
      ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
      ValidationErrorCode.USER_BANNED_FROM_GROUP,
      ValidationErrorCode.GROUP_RESTRICTED,
    ];

    if (forbiddenErrors.includes(code)) {
      return 403;
    }

    const notFoundErrors = [ValidationErrorCode.MENTION_NOT_FOUND];
    if (notFoundErrors.includes(code)) {
      return 404;
    }

    if (code === ValidationErrorCode.SPAM_DETECTED || code === ValidationErrorCode.ESCALATED_TO_ADMIN) {
      return 429;
    }

    return 500;
  }
}