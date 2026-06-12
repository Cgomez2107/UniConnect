import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export interface JWTPayload {
  sub: string; // user id
  role?: string; // user role (estudiante | admin)
  iat: number;
  exp: number;
  jti: string;
}

export interface VerificationTokenPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly verificationTokenSecret: string;
  private readonly accessTokenExpiry = 3600; // 1 hour
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days
  private readonly verificationTokenExpiry = 24 * 60 * 60; // 24 hours

  constructor(
    accessTokenSecret: string = process.env.JWT_ACCESS_SECRET ?? "",
    refreshTokenSecret: string = process.env.JWT_REFRESH_SECRET ?? "",
    verificationTokenSecret: string = process.env.JWT_VERIFICATION_SECRET ?? ""
  ) {
    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required");
    }
    if (!verificationTokenSecret) {
      throw new Error("JWT_VERIFICATION_SECRET is required");
    }

    this.accessTokenSecret = accessTokenSecret;
    this.refreshTokenSecret = refreshTokenSecret;
    this.verificationTokenSecret = verificationTokenSecret;
  }

  generateTokens(userId: string, role?: string): {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
  } {
    const now = Math.floor(Date.now() / 1000);
    const jti = randomUUID();

    const accessPayload: Record<string, unknown> = {
      sub: userId, iat: now, exp: now + this.accessTokenExpiry, jti,
    };
    if (role) accessPayload.role = role;

    const refreshPayload: Record<string, unknown> = {
      sub: userId, iat: now, exp: now + this.refreshTokenExpiry, jti,
    };
    if (role) refreshPayload.role = role;

    const accessToken = jwt.sign(
      accessPayload,
      this.accessTokenSecret,
      { algorithm: "HS256" }
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      this.refreshTokenSecret,
      { algorithm: "HS256" }
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry: this.accessTokenExpiry,
    };
  }

  generateVerificationToken(userId: string, email: string): string {
    const now = Math.floor(Date.now() / 1000);
    const jti = randomUUID();

    const payload: VerificationTokenPayload = {
      sub: userId,
      email,
      iat: now,
      exp: now + this.verificationTokenExpiry,
      jti,
    };

    return jwt.sign(payload, this.verificationTokenSecret, { algorithm: "HS256" });
  }

  verifyVerificationToken(token: string): VerificationTokenPayload | null {
    try {
      return jwt.verify(token, this.verificationTokenSecret) as VerificationTokenPayload;
    } catch {
      return null;
    }
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as JWTPayload;
    } catch {
      return null;
    }
  }
}
