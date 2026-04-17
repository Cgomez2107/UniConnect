import { Pool } from "pg";
import type { EventsEnv } from "../../config/env.js";
import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

/**
 * Schema real de Supabase (tabla `events`):
 *   id, title, description, event_date, location,
 *   category, image_url, created_by, created_at, updated_at
 *
 * La tabla NO tiene: start_at, end_at, organizer_id, status, max_capacity,
 * ni existe la tabla event_registrations.
 */
interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: Date | string;
  location: string | null;
  category: string;
  image_url: string | null;
  created_by: string | null;
  organizer_name: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    // Mantener startAt/endAt en el dominio usando event_date
    startAt: new Date(row.event_date).toISOString(),
    endAt: new Date(row.event_date).toISOString(),
    organizerId: row.created_by ?? "",
    organizerName: row.organizer_name ?? undefined,
    // Campos propios del schema real
    category: row.category as any,
    imageUrl: row.image_url ?? undefined,
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

const SELECT_EVENTS = `
  SELECT
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.location,
    e.category,
    e.image_url,
    e.created_by,
    pr.full_name AS organizer_name,
    e.created_at,
    e.updated_at
  FROM events e
  LEFT JOIN profiles pr ON pr.id = e.created_by
`;

export class PostgresEventRepository implements IEventRepository {
  private readonly pool: Pool;

  constructor(env: EventsEnv) {
    this.pool = buildPool(env);
  }

  async getAllEvents(): Promise<Event[]> {
    const result = await this.pool.query<EventRow>(
      `${SELECT_EVENTS}
       ORDER BY e.event_date DESC`,
    );
    return result.rows.map(mapEvent);
  }

  async getUpcomingEvents(limit: number = 20): Promise<Event[]> {
    const now = new Date().toISOString();
    const result = await this.pool.query<EventRow>(
      `${SELECT_EVENTS}
       WHERE e.event_date > $1
       ORDER BY e.event_date ASC
       LIMIT $2`,
      [now, limit],
    );
    return result.rows.map(mapEvent);
  }

  async getById(id: string): Promise<Event | null> {
    const result = await this.pool.query<EventRow>(
      `${SELECT_EVENTS}
       WHERE e.id = $1
       LIMIT 1`,
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
    category?: string;
    imageUrl?: string;
  }): Promise<Event> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO events (title, description, location, event_date, category, image_url, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.title,
        input.description,
        input.location,
        input.startAt,           // guardamos startAt como event_date
        input.category ?? "academico",
        input.imageUrl ?? null,
        input.organizerId,
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
    const event = await this.getById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Only the event organizer can update this event");
    }

    // Traducir camelCase → snake_case y mapear startAt → event_date
    const columnMap: Record<string, string> = {
      startAt: "event_date",
      endAt: "event_date",       // no existe end_at, ambos van a event_date
      title: "title",
      description: "description",
      location: "location",
      category: "category",
      imageUrl: "image_url",
    };

    const values: unknown[] = [];
    const setClauses: string[] = [];

    for (const [key, val] of Object.entries(input)) {
      const sqlKey = columnMap[key] ?? key.replace(/([A-Z])/g, "_$1").toLowerCase();
      // Evitar duplicados (startAt y endAt mapearían al mismo campo)
      if (!setClauses.some((c) => c.startsWith(`${sqlKey} =`))) {
        setClauses.push(`${sqlKey} = $${values.length + 1}`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return event;
    }

    values.push(id);

    await this.pool.query(
      `
        UPDATE events
        SET ${setClauses.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
      `,
      values,
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error("Event could not be retrieved after update");
    }

    return updated;
  }

  async updateStatus(_id: string, _organizerId: string, _status: string): Promise<void> {
    // La tabla events no tiene columna status — operación no aplicable
    // Se conserva por compatibilidad con la interfaz
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
