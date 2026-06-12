import { ServerResponse } from "node:http";
import type { JWTPayload } from "./JWTMiddleware.js";
import { sendJson } from "../shared/http/sendJson.js";
import logger from "../../../shared/libs/logging/Logger.js";

export class RoleGuard {
  private readonly requiredRole: string;

  constructor(requiredRole: string = "super_admin") {
    this.requiredRole = requiredRole;
  }

  authorize(payload: JWTPayload | null, res: ServerResponse): boolean {
    if (!payload) {
      sendJson(res, 401, { error: "Token requerido" });
      return false;
    }

    if (!payload.role || payload.role !== this.requiredRole) {
      logger.warn(
        "Admin access denied",
        "RoleGuard",
        {
          userId: payload.sub,
          timestamp: new Date().toISOString(),
          role: payload.role || "none",
          requiredRole: this.requiredRole,
        }
      );

      sendJson(res, 403, { error: "Acceso restringido a super_admin" });
      return false;
    }

    return true;
  }
}
