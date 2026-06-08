export { ApplicationError } from "./ApplicationError.js";
export { AuthenticationError } from "./AuthenticationError.js";
export { AuthorizationError } from "./AuthorizationError.js";
export { ValidationError } from "./ValidationError.js";
export { NotFoundError } from "./NotFoundError.js";
export { ConflictError } from "./ConflictError.js";
export { DomainError } from "./DomainError.js";
export { ContentError } from "./ContentError.js";
export { SizeError } from "./SizeError.js";
export { MediaError } from "./MediaError.js";
export { PermissionError } from "./PermissionError.js";
export { ModerationError } from "./ModerationError.js";
export { mapErrorToHttpStatus } from "./mapHttpStatus.js";
export { sanitizeError } from "./sanitizeError.js";

export type ErrorType =
  | "AuthenticationError"
  | "AuthorizationError"
  | "ValidationError"
  | "NotFoundError"
  | "ConflictError"
  | "DomainError"
  | "ContentError"
  | "SizeError"
  | "MediaError"
  | "PermissionError"
  | "ModerationError"
  | "Unknown";
