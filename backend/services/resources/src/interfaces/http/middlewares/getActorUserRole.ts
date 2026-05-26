import type { IncomingMessage } from "node:http";

export function getActorUserRole(req: IncomingMessage): string | null {
  const roleHeader = req.headers["x-user-role"];
  if (typeof roleHeader === "string" && roleHeader.trim().length > 0) {
    return roleHeader.trim();
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

    if (typeof payload.role === "string" && payload.role.trim().length > 0) {
      return payload.role.trim();
    }

    return typeof payload.user_metadata === "object" && payload.user_metadata !== null
      ? ((payload.user_metadata as Record<string, unknown>).role as string) ?? null
      : null;
  } catch {
    return null;
  }
}
