import { IncomingMessage, ServerResponse } from "node:http";
import { JWTService } from "../../infrastructure/jwt/JWTService.js";
import { sendError } from "../../../../../shared/http/sendJson.js";

export class JWTMiddleware {
  constructor(private jwtService: JWTService) {}

  authenticate(req: IncomingMessage, res: ServerResponse): string | null {
    const auth = req.headers.authorization;
    const authString = Array.isArray(auth) ? auth[0] : auth;
    
    if (!authString?.startsWith("Bearer ")) {
      sendError(res, 401, "Missing or invalid Authorization header");
      return null;
    }

    const token = authString.substring(7);
    const payload = this.jwtService.verifyAccessToken(token);

    if (!payload) {
      sendError(res, 401, "Invalid or expired token");
      return null;
    }

    return payload.sub; // userId
  }
}
