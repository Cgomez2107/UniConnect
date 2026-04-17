export { ApplicationError } from "./ApplicationError.js";
export { AuthenticationError } from "./AuthenticationError.js";
export { AuthorizationError } from "./AuthorizationError.js";
export { ValidationError } from "./ValidationError.js";
export { NotFoundError } from "./NotFoundError.js";
export { ConflictError } from "./ConflictError.js";
export { mapErrorToHttpStatus } from "./mapHttpStatus.js";

export type ErrorType =
  | "AuthenticationError"
  | "AuthorizationError"
  | "ValidationError"
  | "NotFoundError"
  | "ConflictError"
  | "Unknown";
