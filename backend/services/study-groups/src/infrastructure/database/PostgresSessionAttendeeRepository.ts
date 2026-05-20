import type { Pool } from "pg";

import type { SessionAttendee, SessionAttendeeWithUser, AttendeeStatus } from "../../domain/entities/SessionAttendee.js";
import type { ISessionAttendeeRepository } from "../../domain/repositories/ISessionAttendeeRepository.js";

interface SessionAttendeeRow {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  updated_at: Date;
}

interface SessionAttendeeWithUserRow {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  updated_at: Date;
  full_name: string | null;
  avatar_url: string | null;
}

function mapAttendee(row: SessionAttendeeRow): SessionAttendee {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    status: row.status as AttendeeStatus,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapAttendeeWithUser(row: SessionAttendeeWithUserRow): SessionAttendeeWithUser {
  return {
    ...mapAttendee(row),
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
  };
}

export class PostgresSessionAttendeeRepository implements ISessionAttendeeRepository {
  constructor(private readonly pool: Pool) {}

  async upsert(sessionId: string, userId: string, status: AttendeeStatus): Promise<SessionAttendee> {
    const result = await this.pool.query<SessionAttendeeRow>(
      `INSERT INTO session_attendees (session_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, user_id)
       DO UPDATE SET status = $3, updated_at = NOW()
       RETURNING *`,
      [sessionId, userId, status],
    );
    return mapAttendee(result.rows[0]);
  }

  async listBySessionId(sessionId: string): Promise<SessionAttendeeWithUser[]> {
    const result = await this.pool.query<SessionAttendeeWithUserRow>(
      `SELECT sa.id, sa.session_id, sa.user_id, sa.status, sa.updated_at, p.full_name, p.avatar_url
       FROM session_attendees sa
       LEFT JOIN profiles p ON p.id = sa.user_id
       WHERE sa.session_id = $1
       ORDER BY sa.updated_at ASC`,
      [sessionId],
    );
    return result.rows.map(mapAttendeeWithUser);
  }

  async getBySessionAndUser(sessionId: string, userId: string): Promise<SessionAttendee | null> {
    const result = await this.pool.query<SessionAttendeeRow>(
      `SELECT * FROM session_attendees WHERE session_id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    return result.rows[0] ? mapAttendee(result.rows[0]) : null;
  }

  async createPendingForMember(sessionId: string, userId: string): Promise<SessionAttendee> {
    return this.upsert(sessionId, userId, "pending");
  }
}
