import { RefreshToken } from "../../domain/entities/RefreshToken.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";
import type { Pool } from "pg";

export class PostgreSQLTokenRepository implements ITokenRepository {
  constructor(private readonly pool: Pool) {}

  async create(token: Omit<RefreshToken, "id" | "createdAt">): Promise<RefreshToken> {
    const result = await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token, expires_at, created_at, revoked_at`,
      [token.userId, token.token, token.expiresAt],
    );
    return this.toRefreshToken(result.rows[0]);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, token, expires_at, created_at, revoked_at
       FROM refresh_tokens WHERE token = $1`,
      [token],
    );
    if (result.rows.length === 0) return null;
    return this.toRefreshToken(result.rows[0]);
  }

  async revoke(token: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`,
      [token],
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW()`,
    );
    return result.rowCount ?? 0;
  }

  private toRefreshToken(row: Record<string, unknown>): RefreshToken {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      token: row.token as string,
      expiresAt: row.expires_at as Date,
      createdAt: row.created_at as Date,
      revokedAt: row.revoked_at as Date | undefined,
    };
  }
}
