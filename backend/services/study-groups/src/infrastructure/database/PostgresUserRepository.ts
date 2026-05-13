import type { Pool } from "pg";
import type { IUserRepository, ContactInfo } from "../../../../../shared/patterns/strategy/IUserRepository.js";

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async getContactInfo(userId: string): Promise<ContactInfo> {
    const result = await this.pool.query(
      `SELECT email, push_token FROM profiles WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return {};
    }

    return {
      email: result.rows[0].email as string | undefined,
      pushToken: result.rows[0].push_token as string | undefined,
    };
  }
}
