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
  created_at: Date | string;
  read_at: Date | string | null;
}

function mapNotification(row: NotificationRow): UserNotification {
  const payload = row.payload ?? {};
  const { _priority, _action, ...restPayload } = payload as Record<string, unknown> & { _priority?: string; _action?: { label: string; endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" } };
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    payload: Object.keys(restPayload).length > 0 ? restPayload : null,
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    priority: _priority as UserNotification["priority"],
    action: _action,
  };
}

export class PostgresNotificationRepository implements INotificationRepository {
  constructor(private readonly pool: Pool) {}

  async markAsRead(notificationId: string): Promise<void> {
    await this.pool.query(
      "UPDATE user_notifications SET read_at = NOW() WHERE id = $1",
      [notificationId],
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.pool.query(
      "UPDATE user_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL",
      [userId],
    );
  }

  async create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
    priority?: "normal" | "urgente" | "critica";
    action?: { label: string; endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" };
  }): Promise<string> {
    const enrichedPayload = {
      ...(input.payload ?? {}),
      ...(input.priority ? { _priority: input.priority } : {}),
      ...(input.action ? { _action: input.action } : {}),
    };

    const existing = await this.pool.query<{ id: string }>(
      `
        SELECT id FROM user_notifications
        WHERE user_id = $1
          AND type = $2
          AND created_at > NOW() - INTERVAL '30 seconds'
        LIMIT 1
      `,
      [input.userId, input.type],
    );

    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO user_notifications (user_id, type, title, body, payload)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [input.userId, input.type, input.title, input.body, enrichedPayload],
    );

    return result.rows[0].id;
  }

  async listByUser(input: {
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<UserNotification[]> {
    try {
      const offset = input.page * input.pageSize;
      const result = await this.pool.query<NotificationRow>(
        "SELECT * FROM get_user_notifications($1, $2, $3)",
        [input.actorUserId, input.pageSize, offset],
      );

      return result.rows.map(mapNotification);
    } catch (err) {
      console.error("[PostgresNotificationRepository] listByUser failed:", err);
      return [];
    }
  }
}
