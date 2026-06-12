import { IncomingMessage, ServerResponse } from "node:http";
import jwt from "jsonwebtoken";
import type { SigningKey } from "jwks-rsa";
import { JwksClient } from "jwks-rsa";
import { sendJson } from "../shared/http/sendJson.js";

export interface JWTPayload {
  sub: string;
  role?: string;
  iat: number;
  exp: number;
}

export class JWTMiddleware {
  private readonly accessTokenSecret: string;
  private readonly jwksClient: JwksClient | null;

  constructor(accessTokenSecret: string, supabaseUrl?: string) {
    if (!accessTokenSecret) {
      throw new Error("JWT_ACCESS_SECRET is required");
    }

    this.accessTokenSecret = accessTokenSecret;

    if (supabaseUrl) {
      const baseUrl = supabaseUrl.replace(/\/+$/, "");
      this.jwksClient = new JwksClient({
        jwksUri: `${baseUrl}/auth/v1/.well-known/jwks.json`,
        cache: true,
        cacheMaxAge: 600_000,
      });
    } else {
      this.jwksClient = null;
    }
  }

  getToken(req: IncomingMessage): string | null {
    const auth = req.headers.authorization;
    const authString = Array.isArray(auth) ? auth[0] : auth;

    if (authString?.startsWith("Bearer ")) {
      return authString.substring(7);
    }

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

  async verify(token: string): Promise<JWTPayload | null> {
    try {
      return jwt.verify(token, this.accessTokenSecret, { algorithms: ["HS256"] }) as JWTPayload;
    } catch {
      // fall through
    }

    if (this.jwksClient) {
      try {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded !== "object" || !("header" in decoded) || !decoded.header?.kid) {
          return null;
        }

        const key: SigningKey = await this.jwksClient.getSigningKey(decoded.header.kid);
        const publicKey = key.getPublicKey();
        return jwt.verify(token, publicKey, { algorithms: ["ES256"] }) as JWTPayload;
      } catch {
        return null;
      }
    }

    return null;
  }

  async authenticate(req: IncomingMessage, res: ServerResponse): Promise<JWTPayload | null> {
    const token = this.getToken(req);

    if (!token) {
      sendJson(res, 401, { error: "Missing or invalid authentication (Token or Cookie)" });
      return null;
    }

    const payload = await this.verify(token);

    if (!payload) {
      sendJson(res, 401, { error: "Invalid token" });
      return null;
    }

    return payload;
  }
}
