import type { IGroupPermissionRepository } from "../../../../../shared/patterns/chain/message/PermissionValidator.js";
import type { IAdminResolver } from "../../../../../shared/patterns/chain/message/MentionResolver.js";
import type { Pool } from "pg";

export class GroupPermissionRepository implements IGroupPermissionRepository, IAdminResolver {
  constructor(private readonly pool: Pool | null) {}

  async isMemberOrAdmin(requestId: string, userId: string): Promise<boolean> {
    if (!this.pool) return true;

    try {
      const result = await this.pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM study_requests
          WHERE id = $1 AND author_id = $2
          UNION
          SELECT 1 FROM applications
          WHERE request_id = $1 AND applicant_id = $2 AND status = 'aceptada'
          UNION
          SELECT 1 FROM study_request_admins
          WHERE request_id = $1 AND user_id = $2
        ) AS allowed`,
        [requestId, userId],
      );
      return result.rows[0]?.allowed ?? false;
    } catch {
      return false;
    }
  }

  async getCurrentAdminId(requestId: string): Promise<string | null> {
    if (!this.pool) return null;

    try {
      const result = await this.pool.query(
        `SELECT author_id FROM study_requests WHERE id = $1`,
        [requestId],
      );
      return result.rows[0]?.author_id ?? null;
    } catch {
      return null;
    }
  }
}
