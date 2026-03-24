import type { IncomingMessage } from "node:http";

export function getActorUserId(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8"),
    );
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
