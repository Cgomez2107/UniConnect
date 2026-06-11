import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthorizationError } from "../libs/errors/AuthorizationError.js";

export type AdminLevel = "admin" | "super_admin";

export function checkRole(requiredRole: AdminLevel, req: IncomingMessage): boolean {
  const userRole = req.headers["x-user-role"];
  if (!userRole || typeof userRole !== "string") return false;

  const normalizedRole = userRole.trim().toLowerCase();

  if (requiredRole === "super_admin") {
    return normalizedRole === "super_admin";
  }

  if (requiredRole === "admin") {
    return normalizedRole === "admin" || normalizedRole === "super_admin";
  }

  return false;
}

function getActorUserId(req: IncomingMessage): string | null {
  const xUserId = req.headers["x-user-id"];
  if (typeof xUserId === "string" && xUserId.trim()) {
    return xUserId.trim();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  const token = parts[1];
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], "base64").toString("utf-8"),
    );
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function logFailedAttempt(userId: string | null, route: string): void {
  console.log(JSON.stringify({
    service: "gateway",
    level: "warn",
    message: "Acceso restringido — intento de admin sin permisos",
    userId: userId ?? "unknown",
    ruta: route,
    timestamp: new Date().toISOString(),
  }));
}

export function requireRole(requiredRole: AdminLevel) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    if (!checkRole(requiredRole, req)) {
      const userId = getActorUserId(req);
      logFailedAttempt(userId, req.url ?? "/");
      throw new AuthorizationError("Acceso restringido a super_admin");
    }
    return true;
  };
}
