import type { Pool } from "pg";
import type { IEnrollmentRepository } from "../../domain/repositories/IEnrollmentRepository.js";

export class PostgresEnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly pool: Pool) {}

  async isEnrolled(userId: string, subjectId: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1 FROM user_subjects
          WHERE user_id = $1 AND subject_id = $2
        ) AS exists
      `,
      [userId, subjectId],
    );

    return result.rows[0]?.exists ?? false;
  }
}
