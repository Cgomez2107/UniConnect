const SENDGRID_KEY_PATTERN = /SG\.[A-Za-z0-9._-]+/g;
const SENDGRID_KEY_REPLACEMENT = "SG.**REDACTED**";
const URL_PATTERN = /https?:\/\/[^\s"']+/g;
const URL_REPLACEMENT = "***REDACTED_URL***";
const FILE_PATH_PATTERN = /[A-Z]:(?:\\[^\\:*?"<>|]+)+|(?:\/[^/\s]+)+/g;
const FILE_PATH_REPLACEMENT = "***REDACTED_PATH***";

export function sanitizeError(error: unknown): string {
  const rawMsg = typeof error === "string" ? error : (error as Error)?.message ?? "Unknown error";

  let sanitized = rawMsg;
  sanitized = sanitized.replace(SENDGRID_KEY_PATTERN, SENDGRID_KEY_REPLACEMENT);
  sanitized = sanitized.replace(URL_PATTERN, URL_REPLACEMENT);
  sanitized = sanitized.replace(FILE_PATH_PATTERN, FILE_PATH_REPLACEMENT);

  return sanitized;
}
