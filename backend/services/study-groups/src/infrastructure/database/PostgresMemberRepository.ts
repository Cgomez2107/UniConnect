import { Pool } from "pg";

import type { StudyGroupsEnv } from "../../config/env.js";
import type { Member, MemberRole } from "../../domain/entities/Member.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";

interface MemberRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: Date | string | null;
}

function buildPool(env: StudyGroupsEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Database environment variables are incomplete for PostgresMemberRepository");
  }

  return new Pool({
    host: env.dbHost,
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword,
    ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
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
  private readonly pool: Pool;

  constructor(env: StudyGroupsEnv) {
    this.pool = buildPool(env);
  }

  async listByRequest(input: { requestId: string; actorUserId: string }): Promise<Member[]> {
    const result = await this.pool.query<MemberRow>(
      "SELECT * FROM get_request_members($1, $2)",
      [input.requestId, input.actorUserId],
    );

    return result.rows.map(mapMember);
  }
}
