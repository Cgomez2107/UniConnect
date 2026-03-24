import { Pool } from "pg";
import type { EventsEnv } from "../../config/env.js";
import type { Event, EventStatus } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

interface EventRow {
  id: string;
  title: string;
  description: string;
  location: string;
  start_at: Date | string;
  end_at: Date | string;
  organizer_id: string;
  organizer_name: string | null;
  status: EventStatus;
  max_capacity: number | null;
  registered_count: number | string;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: new Date(row.start_at).toISOString(),
    endAt: new Date(row.end_at).toISOString(),
    organizerId: row.organizer_id,
    organizerName: row.organizer_name ?? undefined,
    status: row.status,
    maxCapacity: row.max_capacity,
    registeredCount: Number(row.registered_count),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function buildPool(env: EventsEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Database configuration incomplete");
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

/**
 * Implementación Postgres de IEventRepository
 * Nota: La tabla `events` debe existir en Supabase con campos:
 * id, title, description, location, start_at, end_at, organizer_id,
 * status, max_capacity, created_at, updated_at
 */
export class PostgresEventRepository implements IEventRepository {
  private readonly pool: Pool;

  constructor(env: EventsEnv) {
    this.pool = buildPool(env);
  }

  async getAllEvents(): Promise<Event[]> {
    const result = await this.pool.query<EventRow>(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.location,
          e.start_at,
          e.end_at,
          e.organizer_id,
          pr.full_name AS organizer_name,
          e.status,
          e.max_capacity,
          COALESCE(COUNT(DISTINCT er.id), 0) AS registered_count,
          e.created_at,
          e.updated_at
        FROM events e
        LEFT JOIN profiles pr ON pr.id = e.organizer_id
        LEFT JOIN event_registrations er ON er.event_id = e.id
        WHERE e.status != 'cancelado'
        GROUP BY e.id, pr.full_name
        ORDER BY e.start_at DESC
      `,
    );

    return result.rows.map(mapEvent);
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const now = new Date().toISOString();
    const result = await this.pool.query<EventRow>(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.location,
          e.start_at,
          e.end_at,
          e.organizer_id,
          pr.full_name AS organizer_name,
          e.status,
          e.max_capacity,
          COALESCE(COUNT(DISTINCT er.id), 0) AS registered_count,
          e.created_at,
          e.updated_at
        FROM events e
        LEFT JOIN profiles pr ON pr.id = e.organizer_id
        LEFT JOIN event_registrations er ON er.event_id = e.id
        WHERE e.start_at > $1 AND e.status != 'cancelado'
        GROUP BY e.id, pr.full_name
        ORDER BY e.start_at ASC
        LIMIT $2
      `,
      [now, limit],
    );

    return result.rows.map(mapEvent);
  }

  async getById(id: string): Promise<Event | null> {
    const result = await this.pool.query<EventRow>(
      `
        SELECT
          e.id,
          e.title,
          e.description,
          e.location,
          e.start_at,
          e.end_at,
          e.organizer_id,
          pr.full_name AS organizer_name,
          e.status,
          e.max_capacity,
          COALESCE(COUNT(DISTINCT er.id), 0) AS registered_count,
          e.created_at,
          e.updated_at
        FROM events e
        LEFT JOIN profiles pr ON pr.id = e.organizer_id
        LEFT JOIN event_registrations er ON er.event_id = e.id
        WHERE e.id = $1
        GROUP BY e.id, pr.full_name
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ? mapEvent(result.rows[0]) : null;
  }

  async create(input: {
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string;
    organizerId: string;
    maxCapacity?: number;
  }): Promise<Event> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO events (title, description, location, start_at, end_at, organizer_id, status, max_capacity)
        VALUES ($1, $2, $3, $4, $5, $6, 'abierto', $7)
        RETURNING id
      `,
      [
        input.title,
        input.description,
        input.location,
        input.startAt,
        input.endAt,
        input.organizerId,
        input.maxCapacity ?? null,
      ],
    );

    const created = await this.getById(result.rows[0].id);
    if (!created) {
      throw new Error("Event was created but could not be retrieved");
    }

    return created;
  }

  async update(
    id: string,
    organizerId: string,
    input: Record<string, unknown>,
  ): Promise<Event> {
    // Verificar que el organizador es el propietario
    const event = await this.getById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Only the event organizer can update this event");
    }

    const keys = Object.keys(input);
    if (keys.length === 0) {
      return event;
    }

    const values: unknown[] = [];
    const setClauses: string[] = [];

    keys.forEach((key, idx) => {
      const sqlKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      setClauses.push(`${sqlKey} = $${idx + 1}`);
      values.push(input[key]);
    });

    values.push(id, organizerId);

    await this.pool.query(
      `
        UPDATE events
        SET ${setClauses.join(", ")}, updated_at = NOW()
        WHERE id = $${keys.length + 1} AND organizer_id = $${keys.length + 2}
      `,
      values,
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error("Event could not be retrieved after update");
    }

    return updated;
  }

  async updateStatus(id: string, organizerId: string, status: EventStatus): Promise<void> {
    const event = await this.getById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Only the event organizer can update status");
    }

    await this.pool.query(
      `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id],
    );
  }

  async delete(id: string, organizerId: string): Promise<void> {
    const event = await this.getById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Only the event organizer can delete this event");
    }

    await this.pool.query(`DELETE FROM events WHERE id = $1`, [id]);
  }
}
