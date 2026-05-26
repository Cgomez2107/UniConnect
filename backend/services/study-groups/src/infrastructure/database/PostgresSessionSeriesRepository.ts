import type { Pool } from "pg";

import type { SessionSeries } from "../../domain/entities/SessionSeries.js";
import type { ISessionSeriesRepository, CreateSessionSeriesInput } from "../../domain/repositories/ISessionSeriesRepository.js";

interface SessionSeriesRow {
  id: string;
  request_id: string;
  frequency: string;
  interval: number;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  start_time: string;
  duration_minutes: number;
  location: string | null;
  created_by: string;
  created_at: Date;
}

function mapSeries(row: SessionSeriesRow): SessionSeries {
  return {
    id: row.id,
    requestId: row.request_id,
    frequency: row.frequency as SessionSeries["frequency"],
    interval: row.interval,
    daysOfWeek: row.days_of_week,
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
    location: row.location,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export class PostgresSessionSeriesRepository implements ISessionSeriesRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateSessionSeriesInput): Promise<SessionSeries> {
    const result = await this.pool.query<SessionSeriesRow>(
      `INSERT INTO session_series (request_id, frequency, interval, days_of_week, start_date, end_date, start_time, duration_minutes, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, request_id, frequency, interval, days_of_week, start_date, end_date, start_time, duration_minutes, location, created_by, created_at`,
      [
        input.requestId,
        input.frequency,
        input.interval,
        input.daysOfWeek,
        input.startDate,
        input.endDate,
        input.startTime,
        input.durationMinutes,
        input.location,
        input.createdBy,
      ],
    );
    return mapSeries(result.rows[0]);
  }

  async getById(id: string): Promise<SessionSeries | null> {
    const result = await this.pool.query<SessionSeriesRow>(
      `SELECT id, request_id, frequency, interval, days_of_week, start_date, end_date, start_time, duration_minutes, location, created_by, created_at FROM session_series WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapSeries(result.rows[0]) : null;
  }

  async listByRequestId(requestId: string): Promise<SessionSeries[]> {
    const result = await this.pool.query<SessionSeriesRow>(
      `SELECT id, request_id, frequency, interval, days_of_week, start_date, end_date, start_time, duration_minutes, location, created_by, created_at FROM session_series WHERE request_id = $1 ORDER BY created_at DESC`,
      [requestId],
    );
    return result.rows.map(mapSeries);
  }
}
