import type { Pool } from "pg";
import type { Event, PaginatedResult } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { EventStatus } from "../../domain/state/EventStatus.js";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: Date | string;
  location: string | null;
  category: string;
  category_id: string;
  image_url: string | null;
  created_by: string | null;
  organizer_name: string | null;
  status: string;
  max_capacity: number | null;
  registered_count: number;
  deleted_at: Date | string | null;
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
    categoryId: row.category_id,
    imageUrl: row.image_url ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    status: row.status as EventStatus,
    maxCapacity: row.max_capacity ?? null,
    registeredCount: row.registered_count,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
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
    e.category_id,
    e.image_url,
    e.created_by,
    pr.full_name AS organizer_name,
    e.status,
    e.max_capacity,
    e.registered_count,
    e.deleted_at,
    e.created_at,
    e.updated_at
  FROM events e
  LEFT JOIN profiles pr ON pr.id = e.created_by
`;

export class PostgresEventRepository implements IEventRepository {
  constructor(private readonly pool: Pool) {}

  private async finalizeExpiredEvents(): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE events SET status = 'finished'
         WHERE status = 'published'
           AND event_date <= NOW()
           AND deleted_at IS NULL`,
      );
    } catch (err) {
      console.error("[PostgresEventRepository] finalizeExpiredEvents failed:", err);
    }
  }

  async list(
    page: number = 1,
    limit: number = 20,
    includeDeleted: boolean = false,
    status?: EventStatus,
    createdBy?: string,
  ): Promise<PaginatedResult<Event>> {
    await this.finalizeExpiredEvents();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (safePage - 1) * safeLimit;

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (includeDeleted) {
      whereClauses.push("e.deleted_at IS NOT NULL");
    } else {
      whereClauses.push("e.deleted_at IS NULL");
    }
    if (status) {
      whereClauses.push(`e.status = $${paramIndex++}`);
      params.push(status);
    }
    if (createdBy) {
      whereClauses.push(`e.created_by = $${paramIndex++}`);
      params.push(createdBy);
    }

    const whereSQL =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM events e ${whereSQL}`,
      params,
    );
    const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

    params.push(safeLimit, offset);
    const limitIdx = paramIndex++;
    const offsetIdx = paramIndex++;

    const result = await this.pool.query<EventRow>(
      `${SELECT_EVENTS}
       ${whereSQL}
       ORDER BY e.event_date DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );

    return {
      data: result.rows.map(mapEvent),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async getUpcomingEvents(limit: number = 20): Promise<Event[]> {
    await this.finalizeExpiredEvents();
    const now = new Date().toISOString();
    const result = await this.pool.query<EventRow>(
      `${SELECT_EVENTS}
       WHERE e.event_date > $1
         AND e.deleted_at IS NULL
         AND e.status = 'published'
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
    maxCapacity?: number | null;
    category?: string;
    imageUrl?: string;
  }): Promise<Event> {
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

    const maxCap = input.maxCapacity ?? null;

    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO events (title, description, location, event_date, category, category_id, image_url, created_by, status, max_capacity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
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
        maxCap,
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
      maxCapacity: "max_capacity",
    };

    const values: unknown[] = [];
    const setClauses: string[] = [];

    for (const [key, val] of Object.entries(input)) {
      if (val === undefined) continue;
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

  async updateStatus(id: string, status: EventStatus): Promise<void> {
    const result = await this.pool.query(
      `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id],
    );
    if (result.rowCount === 0) {
      throw new Error("Event not found");
    }
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.pool.query(
      `UPDATE events SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id],
    );
    if (result.rowCount === 0) {
      throw new Error("Event not found");
    }
  }

  async getRegisteredUsers(eventId: string): Promise<string[]> {
    const result = await this.pool.query<{ user_id: string }>(
      `SELECT user_id FROM event_registrations WHERE event_id = $1`,
      [eventId],
    );
    return result.rows.map((r) => r.user_id);
  }

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const eventResult = await client.query<EventRow>(
        `SELECT status, max_capacity, registered_count FROM events WHERE id = $1 FOR UPDATE`,
        [eventId],
      );
      if (eventResult.rows.length === 0) {
        throw new Error("Event not found");
      }
      const event = eventResult.rows[0];
      if (event.status !== "published") {
        throw new Error("Event is not open for registration");
      }
      if (event.max_capacity !== null && event.registered_count >= event.max_capacity) {
        throw new Error("Event is full");
      }

      await client.query(
        `INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, userId],
      );

      await client.query(
        `UPDATE events SET registered_count = registered_count + 1 WHERE id = $1`,
        [eventId],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
