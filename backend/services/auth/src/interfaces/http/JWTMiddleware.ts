import { IncomingMessage, ServerResponse } from "node:http";
import { JWTService } from "../../infrastructure/jwt/JWTService.js";

// Helper function simple
function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

export class JWTMiddleware {
  constructor(private jwtService: JWTService) {}

  authenticate(req: IncomingMessage, res: ServerResponse): string | null {
    const auth = req.headers.authorization;
    const authString = Array.isArray(auth) ? auth[0] : auth;
    
    if (!authString?.startsWith("Bearer ")) {
      sendJson(res, 401, { error: "Missing or invalid Authorization header" });
      return null;
    }

    const token = authString.substring(7);
    const payload = this.jwtService.verifyAccessToken(token);

    if (!payload) {
      sendJson(res, 401, { error: "Invalid or expired token" });
      return null;
    }

    return payload.sub; // userId
  }
}
