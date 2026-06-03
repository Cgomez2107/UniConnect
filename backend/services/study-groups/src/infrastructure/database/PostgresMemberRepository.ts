import type { Pool } from "pg";

import type { Member, MemberRole } from "../../domain/entities/Member.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";

interface MemberRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: Date | string | null;
}

function mapMember(row: MemberRow): Member {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    joinedAt: row.joined_at ? new Date(row.joined_at).toISOString() : null,
  };
}

export class PostgresMemberRepository implements IMemberRepository {
  constructor(private readonly pool: Pool) {}

  async listByRequest(input: { requestId: string; actorUserId: string }): Promise<Member[]> {
    const result = await this.pool.query<MemberRow>(
      "SELECT * FROM get_request_members($1, $2)",
      [input.requestId, input.actorUserId],
    );

    return result.rows.map(mapMember);
  }

  async findByGroup(groupId: string): Promise<Member[]> {
    const result = await this.pool.query<MemberRow>(
      `SELECT DISTINCT ON (base.user_id)
        base.user_id,
        prof.full_name,
        prof.avatar_url,
        base.role,
        base.joined_at
      FROM (
        SELECT sr.author_id AS user_id, 'autor'::text AS role, sr.created_at AS joined_at
        FROM study_requests sr
        WHERE sr.id = $1
        UNION ALL
        SELECT sra.user_id, 'admin'::text AS role, sra.created_at AS joined_at
        FROM study_request_admins sra
        WHERE sra.request_id = $1
        UNION ALL
        SELECT a.applicant_id AS user_id, 'miembro'::text AS role, a.reviewed_at AS joined_at
        FROM applications a
        WHERE a.request_id = $1 AND a.status = 'aceptada'
      ) base
      JOIN profiles prof ON prof.id = base.user_id
      ORDER BY base.user_id,
               CASE base.role WHEN 'autor' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
               base.joined_at ASC`,
      [groupId],
    );
    return result.rows.map(mapMember);
  }
}
