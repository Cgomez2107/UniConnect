import type { IncomingMessage } from "node:http";

export function getActorUserRole(req: IncomingMessage): string | null {
  const roleHeader = req.headers["x-user-role"];
  if (typeof roleHeader === "string" && roleHeader.trim().length > 0) {
    const trimmed = roleHeader.trim();
    if (trimmed !== "authenticated") {
      return trimmed;
    }
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    // 1. Check user_metadata.role
    if (
      typeof payload.user_metadata === "object" &&
      payload.user_metadata !== null &&
      typeof (payload.user_metadata as any).role === "string" &&
      (payload.user_metadata as any).role.trim().length > 0
    ) {
      return (payload.user_metadata as any).role.trim();
    }

    // 2. Check app_metadata.role
    if (
      typeof payload.app_metadata === "object" &&
      payload.app_metadata !== null &&
      typeof (payload.app_metadata as any).role === "string" &&
      (payload.app_metadata as any).role.trim().length > 0
    ) {
      return (payload.app_metadata as any).role.trim();
    }

    // 3. Fallback to payload.role if it's not "authenticated"
    if (
      typeof payload.role === "string" &&
      payload.role.trim().length > 0 &&
      payload.role.trim() !== "authenticated"
    ) {
      return payload.role.trim();
    }

    return null;
  } catch {
    return null;
  }
}
