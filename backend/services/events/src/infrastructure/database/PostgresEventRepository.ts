import type { Pool } from "pg";
import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

/**
 * Schema real de Supabase (tabla `events`):
 *   id, title, description, event_date, location,
 *   category, image_url, created_by, created_at, updated_at
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
    startAt: new Date(row.event_date).toISOString(),
    endAt: new Date(row.event_date).toISOString(),
    organizerId: row.created_by ?? "",
    organizerName: row.organizer_name ?? undefined,
    category: row.category as any,
    imageUrl: row.image_url ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
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
  constructor(private readonly pool: Pool) {}

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
    // Resolver category slug → category_id
    const catSlug = input.category ?? "academico";
    const catResult = await this.pool.query<{ id: string }>(
      `SELECT id FROM event_categories WHERE slug = $1`,
      [catSlug],
    );
    const categoryId = catResult.rows[0]?.id ?? (
      await this.pool.query<{ id: string }>(
        `SELECT id FROM event_categories WHERE slug = 'otro'`,
      )
    ).rows[0]?.id;

    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO events (title, description, location, event_date, category, category_id, image_url, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        input.title,
        input.description,
        input.location,
        input.startAt,
        catSlug,
        categoryId ?? null,
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

    const columnMap: Record<string, string> = {
      startAt: "event_date",
      endAt: "event_date",
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
    // N/A
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
