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
}
