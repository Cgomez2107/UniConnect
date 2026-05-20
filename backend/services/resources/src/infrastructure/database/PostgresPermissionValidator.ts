import type { Pool } from "pg";
import type { IPermissionValidator } from "../../domain/services/IPermissionValidator.js";

export class PostgresPermissionValidator implements IPermissionValidator {
  constructor(private readonly pool: Pool) {}

  async canEditResource(resourceId: string, actorUserId: string): Promise<boolean> {
    const result = await this.pool.query<{ allowed: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1 FROM study_resources sr
          LEFT JOIN study_requests req ON req.subject_id = sr.subject_id
          LEFT JOIN study_request_admins adm ON adm.request_id = req.id AND adm.user_id = $2
          WHERE sr.id = $1
            AND (
              sr.user_id = $2
              OR req.author_id = $2
              OR adm.user_id = $2
            )
        ) AS allowed
      `,
      [resourceId, actorUserId],
    );

    return result.rows[0]?.allowed ?? false;
  }
}
