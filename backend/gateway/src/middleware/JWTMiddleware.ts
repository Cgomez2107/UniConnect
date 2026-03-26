import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../shared/http/sendJson.js";

export interface JWTPayload {
  sub: string; // user id
  iat: number;
  exp: number;
}

/**
 * JWT Middleware para validar tokens en el gateway
 * Este middleware es usado por rutas protegidas que lo requieren
 */
export class JWTMiddleware {
  private readonly accessTokenSecret: string;

  constructor(accessTokenSecret: string = process.env.JWT_ACCESS_SECRET || "access-secret") {
    this.accessTokenSecret = accessTokenSecret;
  }

  /**
   * Valida el JWT token sin usar librerías externas (evita dependencias)
   * En producción, importar 'jsonwebtoken' para validación segura
   */
  authenticate(req: IncomingMessage, res: ServerResponse): JWTPayload | null {
    const auth = req.headers.authorization;
    const authString = Array.isArray(auth) ? auth[0] : auth;
    
    if (!authString?.startsWith("Bearer ")) {
      sendJson(res, 401, { error: "Missing or invalid Authorization header" });
      return null;
    }

    const token = authString.substring(7);
    
    // NOTA: Implementación simplificada sin librería JWT
    // En producción, usar:
    // const payload = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
    
    try {
      // Decodificar JWT sin verificar firma (para demostración)
      // En producción, verificar la firma con la librería jwt
      const parts = token.split(".");
      if (parts.length !== 3) {
        sendJson(res, 401, { error: "Invalid token format" });
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      ) as JWTPayload;

      // Validar expiración
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        sendJson(res, 401, { error: "Token expired" });
        return null;
      }

      return payload;
    } catch {
      sendJson(res, 401, { error: "Invalid or malformed token" });
      return null;
    }
  }
}
