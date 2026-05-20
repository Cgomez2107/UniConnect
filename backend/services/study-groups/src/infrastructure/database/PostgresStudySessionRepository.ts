import type { Pool } from "pg";

import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository, ListSessionsFilters, CreateStudySessionInput } from "../../domain/repositories/IStudySessionRepository.js";

interface StudySessionRow {
  id: string;
  series_id: string | null;
  request_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  remind_at: string | null;
  reminded: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

function mapSession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    seriesId: row.series_id,
    requestId: row.request_id,
    title: row.title,
    description: row.description ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    status: row.status as StudySession["status"],
    remindAt: row.remind_at ? new Date(row.remind_at).toISOString() : null,
    reminded: row.reminded,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export class PostgresStudySessionRepository implements IStudySessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateStudySessionInput): Promise<StudySession> {
    const result = await this.pool.query<StudySessionRow>(
      `INSERT INTO study_sessions (series_id, request_id, title, description, start_time, end_time, location, remind_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.seriesId,
        input.requestId,
        input.title,
        input.description ?? null,
        input.startTime,
        input.endTime,
        input.location,
        input.remindAt,
        input.createdBy,
      ],
    );
    return mapSession(result.rows[0]);
  }

  async createMany(inputs: CreateStudySessionInput[]): Promise<StudySession[]> {
    if (inputs.length === 0) return [];

    const results: StudySession[] = [];
    for (const input of inputs) {
      const session = await this.create(input);
      results.push(session);
    }
    return results;
  }

  async getById(id: string): Promise<StudySession | null> {
    const result = await this.pool.query<StudySessionRow>(
      `SELECT * FROM study_sessions WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapSession(result.rows[0]) : null;
  }

  async listByRequestId(requestId: string, filters?: ListSessionsFilters): Promise<StudySession[]> {
    let query = `SELECT * FROM study_sessions WHERE request_id = $1`;
    const params: unknown[] = [requestId];
    let paramIndex = 2;

    if (filters?.from) {
      query += ` AND start_time >= $${paramIndex}`;
      params.push(filters.from);
      paramIndex++;
    }

    if (filters?.to) {
      query += ` AND start_time <= $${paramIndex}`;
      params.push(filters.to);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` ORDER BY start_time ASC`;

    const result = await this.pool.query<StudySessionRow>(query, params);
    return result.rows.map(mapSession);
  }

  async cancel(id: string): Promise<StudySession> {
    const result = await this.pool.query<StudySessionRow>(
      `UPDATE study_sessions SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return mapSession(result.rows[0]);
  }

  async findPendingReminders(): Promise<StudySession[]> {
    const result = await this.pool.query<StudySessionRow>(
      `SELECT * FROM study_sessions
       WHERE remind_at <= NOW() AND reminded = FALSE AND status = 'scheduled'
       FOR UPDATE SKIP LOCKED`,
    );
    return result.rows.map(mapSession);
  }

  async markReminded(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE study_sessions SET reminded = TRUE, updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async listAttendeeUserIds(sessionId: string): Promise<string[]> {
    const result = await this.pool.query<{ user_id: string }>(
      `SELECT user_id FROM session_attendees WHERE session_id = $1 AND status IN ('pending', 'confirmed')`,
      [sessionId],
    );
    return result.rows.map(r => r.user_id);
  }

  async isGroupMember(requestId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM study_requests WHERE id = $1 AND author_id = $2
        UNION
        SELECT 1 FROM applications WHERE request_id = $1 AND applicant_id = $2 AND status = 'aceptada'
        UNION
        SELECT 1 FROM study_request_admins WHERE request_id = $1 AND user_id = $2
      ) AS exists`,
      [requestId, userId],
    );
    return result.rows[0]?.exists ?? false;
  }
}
