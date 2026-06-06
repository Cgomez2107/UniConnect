import { Pool } from "pg";
import { RefreshToken } from "../../domain/entities/RefreshToken.js";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository.js";

export class PostgreSQLTokenRepository implements ITokenRepository {
  private pool: Pool;

  constructor(connectionString?: string) {
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]+/g, "").replace(/[?&]$/, "");
    this.pool = new Pool({
      connectionString: cleanUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });
  }

  async create(token: Omit<RefreshToken, "id" | "createdAt">): Promise<RefreshToken> {
    const id = crypto.randomUUID();
    const createdAt = new Date();

    const result = await this.pool.query(
      `INSERT INTO public.refresh_tokens (id, user_id, token, expires_at, created_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, token.userId, token.token, token.expiresAt, createdAt, token.revokedAt || null]
    );

    return this.mapRowToToken(result.rows[0]);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await this.pool.query(
      `SELECT * FROM public.refresh_tokens WHERE token = $1`,
      [token]
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.mapRowToToken(row);
  }

  async revoke(token: string): Promise<void> {
    await this.pool.query(
      `UPDATE public.refresh_tokens SET revoked_at = NOW() WHERE token = $1`,
      [token]
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM public.refresh_tokens WHERE expires_at < NOW()`
    );
    return parseInt(result.rowCount?.toString() || "0", 10);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private mapRowToToken(row: any): RefreshToken {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      revokedAt: row.revoked_at,
    };
  }
}
