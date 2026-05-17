import type { Pool } from "pg";

export class PostgresIdempotencyStore {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS message_idempotency (
        message_id VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_message_idempotency_created_at
        ON message_idempotency (created_at);
    `);
  }

  async markProcessed(messageId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `INSERT INTO message_idempotency (message_id) VALUES ($1)
         ON CONFLICT (message_id) DO NOTHING
         RETURNING message_id`,
        [messageId],
      );
      return result.rowCount !== null && result.rowCount > 0;
    } catch {
      return true;
    }
  }

  async cleanup(olderThanSeconds: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM message_idempotency WHERE created_at < NOW() - INTERVAL '1 second' * $1`,
      [olderThanSeconds],
    );
  }
}
