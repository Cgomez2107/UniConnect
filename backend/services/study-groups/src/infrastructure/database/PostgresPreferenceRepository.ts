import type { Pool } from "pg";
import type { IPreferenceRepository } from "../../../../../shared/patterns/strategy/IPreferenceRepository.js";

export class PostgresPreferenceRepository implements IPreferenceRepository {
  constructor(private readonly pool: Pool) {}

  async getCanalesActivos(userId: string, eventType: string): Promise<string[] | null> {
    const result = await this.pool.query<{ get_active_notification_channels: unknown }>(
      "SELECT get_active_notification_channels($1, $2) AS get_active_notification_channels",
      [userId, eventType],
    );

    const raw = result.rows[0]?.get_active_notification_channels;
    if (!raw) return null;

    const channels = raw as unknown[];
    return channels.map(String);
  }

  async setCanalActivo(userId: string, eventType: string, canal: string, activo: boolean): Promise<void> {
    await this.pool.query(
      "SELECT set_notification_channel_active($1, $2, $3, $4)",
      [userId, eventType, canal, activo],
    );
  }
}
