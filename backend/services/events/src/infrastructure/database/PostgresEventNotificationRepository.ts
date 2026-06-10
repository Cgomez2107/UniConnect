import type { Pool } from "pg";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

export class PostgresEventNotificationRepository implements INotificationRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
  }): Promise<string> {
    const dupCheck = await this.pool.query<{ id: string }>(
      `
        SELECT id FROM user_notifications
        WHERE user_id = $1
          AND type = $2
          AND title = $3
          AND created_at > NOW() - INTERVAL '30 seconds'
        LIMIT 1
      `,
      [input.userId, input.type, input.title],
    );

    if (dupCheck.rows[0]) {
      return dupCheck.rows[0].id;
    }

    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO user_notifications (user_id, type, title, body, payload)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [input.userId, input.type, input.title, input.body, input.payload ?? null],
    );

    return result.rows[0].id;
  }
}
