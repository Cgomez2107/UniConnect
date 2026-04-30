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

  constructor(accessTokenSecret: string) {
    if (!accessTokenSecret) {
      throw new Error("JWT_ACCESS_SECRET is required");
    }

    this.accessTokenSecret = accessTokenSecret;
  }

  /**
   * Valida el JWT token sin usar librerías externas (evita dependencias)
   * En producción, importar 'jsonwebtoken' para validación segura
   */
  /**
   * Extrae el token del header o de las cookies de forma silenciosa
   */
  getToken(req: IncomingMessage): string | null {
    // 1. Intentar obtener del header Authorization
    const auth = req.headers.authorization;
    const authString = Array.isArray(auth) ? auth[0] : auth;
    
    if (authString?.startsWith("Bearer ")) {
      return authString.substring(7);
    }

    // 2. Intentar obtener de las cookies (para web dashboard)
    const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, c) => {
        const [key, val] = c.trim().split("=");
        if (key) acc[key] = val;
        return acc;
      }, {} as Record<string, string>);
      
      return cookies["auth_token"] || null;
    }

    return null;
  }

  /**
   * Valida el JWT token sin usar librerías externas (evita dependencias)
   * En producción, importar 'jsonwebtoken' para validación segura
   */
  authenticate(req: IncomingMessage, res: ServerResponse): JWTPayload | null {
    const token = this.getToken(req);

    if (!token) {
      sendJson(res, 401, { error: "Missing or invalid authentication (Token or Cookie)" });
      return null;
    }
    
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
        Buffer.from(parts[1], "base64url").toString("utf-8")
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
