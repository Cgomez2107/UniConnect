import { RefreshToken } from "../../domain/entities/RefreshToken.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";

// TODO: Reemplazar con PostgreSQL cuando esté disponible
export class PostgreSQLTokenRepository implements ITokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  async create(token: Omit<RefreshToken, "id" | "createdAt">): Promise<RefreshToken> {
    // TODO: INSERT INTO refresh_tokens (...) VALUES (...)
    const id = crypto.randomUUID();
    const newToken: RefreshToken = {
      ...token,
      id,
      createdAt: new Date(),
    };
    this.tokens.set(id, newToken);
    return newToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    // TODO: SELECT * FROM refresh_tokens WHERE token = $1
    return Array.from(this.tokens.values()).find((t) => t.token === token) || null;
  }

  async revoke(token: string): Promise<void> {
    // TODO: UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1
    const stored = Array.from(this.tokens.values()).find((t) => t.token === token);
    if (stored) {
      stored.revokedAt = new Date();
    }
  }

  async deleteExpired(): Promise<number> {
    // TODO: DELETE FROM refresh_tokens WHERE expires_at < NOW()
    let count = 0;
    const now = new Date();
    for (const [key, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(key);
        count++;
      }
    }
    return count;
  }
}
