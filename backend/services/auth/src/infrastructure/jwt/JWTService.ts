import jwt from "jsonwebtoken";

export interface JWTPayload {
  sub: string; // user id
  iat: number;
  exp: number;
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = 3600; // 1 hour
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days

  constructor(
    accessTokenSecret: string = process.env.JWT_ACCESS_SECRET ?? "",
    refreshTokenSecret: string = process.env.JWT_REFRESH_SECRET ?? ""
  ) {
    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required");
    }

    this.accessTokenSecret = accessTokenSecret;
    this.refreshTokenSecret = refreshTokenSecret;
  }

  generateTokens(userId: string): {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
  } {
    const now = Math.floor(Date.now() / 1000);

    const accessToken = jwt.sign(
      { sub: userId, iat: now, exp: now + this.accessTokenExpiry },
      this.accessTokenSecret,
      { algorithm: "HS256" }
    );

    const refreshToken = jwt.sign(
      { sub: userId, iat: now, exp: now + this.refreshTokenExpiry },
      this.refreshTokenSecret,
      { algorithm: "HS256" }
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry: this.accessTokenExpiry,
    };
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
