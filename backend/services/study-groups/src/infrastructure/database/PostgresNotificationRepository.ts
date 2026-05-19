import type { Pool } from "pg";

import type { UserNotification } from "../../domain/entities/UserNotification.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  priority: string | null;
  action: Record<string, unknown> | null;
  created_at: Date | string;
  read_at: Date | string | null;
}

function mapNotification(row: NotificationRow): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    payload: row.payload,
    priority: row.priority ?? undefined,
    action: row.action ? (row.action as { label: string; endpoint: string }) : null,
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
  };
}

export class PostgresNotificationRepository implements INotificationRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
    priority?: string;
    action?: { label: string; endpoint: string } | null;
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO user_notifications (user_id, type, title, body, payload, priority, action)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [input.userId, input.type, input.title, input.body, input.payload, input.priority ?? 'normal', input.action ?? null],
    );

    return result.rows[0].id;
  }

  async listByUser(input: {
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<UserNotification[]> {
    const offset = input.page * input.pageSize;
    const result = await this.pool.query<NotificationRow>(
      "SELECT * FROM get_user_notifications($1, $2, $3)",
      [input.actorUserId, input.pageSize, offset],
    );

    return result.rows.map(mapNotification);
  }
}
