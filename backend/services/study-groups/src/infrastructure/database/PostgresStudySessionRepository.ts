import type { Pool } from "pg";
import type { StudySession, CreateSessionInput } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";

interface SessionRow {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  start_time: Date | string;
  end_time: Date | string;
  rrule: string | null;
  parent_series_id: string | null;
  created_by: string;
  cancelled_at: Date | string | null;
  reminder_sent_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    description: row.description ?? "",
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
    rrule: row.rrule,
    parentSeriesId: row.parent_series_id,
    createdBy: row.created_by,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
    reminderSentAt: row.reminder_sent_at ? new Date(row.reminder_sent_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const SELECT_SESSION = `
  SELECT
    id, group_id, title, description,
    start_time, end_time, rrule, parent_series_id,
    created_by, cancelled_at, reminder_sent_at,
    created_at, updated_at
  FROM study_sessions
`;

export class PostgresStudySessionRepository implements IStudySessionRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<StudySession | null> {
    const result = await this.pool.query<SessionRow>(
      `${SELECT_SESSION} WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapSession(result.rows[0]) : null;
  }

  async findByGroup(groupId: string, from?: string, to?: string): Promise<StudySession[]> {
    let query = `${SELECT_SESSION} WHERE group_id = $1`;
    const params: unknown[] = [groupId];
    let paramIndex = 2;

    if (from) {
      query += ` AND start_time >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }
    if (to) {
      query += ` AND start_time <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }

    query += " ORDER BY start_time ASC";
    const result = await this.pool.query<SessionRow>(query, params);
    return result.rows.map(mapSession);
  }

  async findBySeries(parentSeriesId: string): Promise<StudySession[]> {
    const result = await this.pool.query<SessionRow>(
      `${SELECT_SESSION} WHERE parent_series_id = $1 ORDER BY start_time ASC`,
      [parentSeriesId],
    );
    return result.rows.map(mapSession);
  }

  async findUpcomingWithoutReminder(withinMinutes: number): Promise<StudySession[]> {
    const now = new Date();
    const deadline = new Date(now.getTime() + withinMinutes * 60_000);
    const result = await this.pool.query<SessionRow>(
      `SELECT * FROM study_sessions
       WHERE cancelled_at IS NULL
         AND reminder_sent_at IS NULL
         AND start_time > $1
         AND start_time <= $2
       ORDER BY start_time ASC`,
      [now.toISOString(), deadline.toISOString()],
    );
    return result.rows.map(mapSession);
  }

  async create(data: CreateSessionInput): Promise<StudySession> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO study_sessions (group_id, title, description, start_time, end_time, rrule, parent_series_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        data.groupId,
        data.title,
        data.description || "",
        data.startTime,
        data.endTime,
        data.rrule ?? null,
        data.parentSeriesId ?? null,
        data.createdBy,
      ],
    );
    const created = await this.findById(result.rows[0].id);
    if (!created) throw new Error("Session created but could not be retrieved");
    return created;
  }

  async cancel(id: string, userId: string): Promise<StudySession> {
    const session = await this.findById(id);
    if (!session) throw new Error("Study session not found");
    if (session.cancelledAt) throw new Error("Study session is already cancelled");
    if (session.createdBy !== userId) throw new Error("Only the creator can cancel this session");

    const result = await this.pool.query<SessionRow>(
      `UPDATE study_sessions SET cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return mapSession(result.rows[0]);
  }

  async markReminderSent(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE study_sessions SET reminder_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }
}
