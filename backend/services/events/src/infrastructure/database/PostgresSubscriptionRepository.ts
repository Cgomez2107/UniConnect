/**
 * DDL — Creación de la tabla event_subscriptions
 *
 * ```sql
 * CREATE TABLE IF NOT EXISTS event_subscriptions (
 *   user_id    VARCHAR(255) NOT NULL,
 *   category   VARCHAR(50)  NOT NULL,
 *   created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
 *   PRIMARY KEY (user_id, category)
 * );
 *
 * CREATE INDEX IF NOT EXISTS idx_event_subscriptions_category
 *   ON event_subscriptions (category);
 * ```
 *
 * - user_id: UUID del estudiante (corresponde al sub del JWT)
 * - category: "academico" | "cultural" | "deportivo" | "otro"
 * - PK compuesta: un usuario no puede suscribirse dos veces a la misma categoría
 * - ON CONFLICT DO NOTHING en subscribe para idempotencia
 */

import type { Pool } from "pg";
import type { EventCategory } from "../../domain/entities/Event.js";
import type { ISubscriptionRepository } from "../../domain/events/subscriptions/ISubscriptionRepository.js";

export class PostgresSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly pool: Pool) {}

  async subscribe(userId: string, category: EventCategory): Promise<void> {
    await this.pool.query(
      `INSERT INTO event_subscriptions (user_id, category)
       VALUES ($1, $2)
       ON CONFLICT (user_id, category) DO NOTHING`,
      [userId, category],
    );
  }

  async unsubscribe(userId: string, category: EventCategory): Promise<void> {
    await this.pool.query(
      `DELETE FROM event_subscriptions WHERE user_id = $1 AND category = $2`,
      [userId, category],
    );
  }

  async getSubscribersByCategory(category: EventCategory): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT user_id FROM event_subscriptions WHERE category = $1`,
      [category],
    );
    return result.rows.map(r => r.user_id as string);
  }

  async getUserSubscriptions(userId: string): Promise<EventCategory[]> {
    const result = await this.pool.query(
      `SELECT category FROM event_subscriptions WHERE user_id = $1`,
      [userId],
    );
    return result.rows.map(r => r.category as EventCategory);
  }

  async getAllUserIds(): Promise<string[]> {
    try {
      const result = await this.pool.query<{ id: string }>(
        `SELECT id FROM profiles`,
      );
      return result.rows.map(r => r.id);
    } catch (err) {
      console.error("[PostgresSubscriptionRepository] getAllUserIds failed:", err);
      return [];
    }
  }
}
