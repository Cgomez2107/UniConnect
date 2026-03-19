import type { IncomingMessage } from "node:http";

export function getActorUserId(req: IncomingMessage): string | null {
  const userIdHeader = req.headers["x-user-id"];
  if (typeof userIdHeader === "string" && userIdHeader.trim().length > 0) {
    return userIdHeader.trim();
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

    return typeof payload.sub === "string" && payload.sub.trim().length > 0
      ? payload.sub.trim()
      : null;
  } catch {
    return null;
  }
}
