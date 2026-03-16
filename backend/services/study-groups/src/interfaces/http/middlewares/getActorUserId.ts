import type { IncomingMessage } from "node:http";

/**
 * Temporary actor extraction until JWT validation is introduced.
 * The header keeps write flows testable without coupling business code to auth implementation details.
 */
export function getActorUserId(req: IncomingMessage): string | null {
  const rawHeader = req.headers["x-user-id"];

  if (Array.isArray(rawHeader)) {
    return rawHeader[0] ?? null;
  }

  return typeof rawHeader === "string" && rawHeader.trim().length > 0 ? rawHeader.trim() : null;
}