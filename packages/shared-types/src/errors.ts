export type {
  ErrorCode,
  ErrorSeverity,
  DomainError,
  ApiErrorResponse,
  ValidationErrorDetails,
} from "./lib/errors.js";

export {
  HTTP_STATUS_TO_ERROR_CODE,
  ERROR_CODE_TO_HTTP_STATUS,
  ERROR_MESSAGES,
  zodErrorToApiError,
} from "./lib/errors.js";

export interface ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  severity: ErrorSeverity;
  details: {
    errors: ValidationErrorDetails[];
  };
  timestamp: Date;
}

import type { ErrorSeverity, ValidationErrorDetails } from "./lib/errors.js";
