import type { Pool } from "pg";
import type { CreateStudyResourceInput, StudyResource } from "../../domain/entities/StudyResource.js";
import type {
  IStudyResourceRepository,
  ListStudyResourcesFilters,
} from "../../domain/repositories/IStudyResourceRepository.js";

interface StudyResourceRow {
  id: string;
  user_id: string;
  program_id: string;
  subject_id: string;
  resource_type: string | null;
  title: string;
  description: string | null;
  url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_scraped_at: string | Date | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size_kb: number | null;
  created_at: string | Date;
  updated_at: string | Date;
  author_full_name: string | null;
  author_avatar_url: string | null;
  subject_name: string | null;
  full_count?: string | number;
}

function parseResourceType(value: string | null): "file" | "link" {
  if (value === "file" || value === "link") return value;
  return "file";
}

function mapStudyResource(row: StudyResourceRow): StudyResource {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    subjectId: row.subject_id,
    resourceType: parseResourceType(row.resource_type),
    title: row.title,
    description: row.description,
    url: row.url,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image,
    ogScrapedAt: row.og_scraped_at ? new Date(row.og_scraped_at).toISOString() : null,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSizeKb: row.file_size_kb,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    profiles: row.author_full_name
      ? {
          fullName: row.author_full_name,
          avatarUrl: row.author_avatar_url,
        }
      : undefined,
    subjects: row.subject_name
      ? {
          name: row.subject_name,
        }
      : undefined,
  };
}

export class PostgresStudyResourceRepository implements IStudyResourceRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters: ListStudyResourcesFilters): Promise<{ rows: StudyResource[]; total: number }> {
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (filters.subjectId) {
      values.push(filters.subjectId);
      conditions.push(`sr.subject_id = $${values.length}`);
    }

    if (filters.userId) {
      values.push(filters.userId);
      conditions.push(`sr.user_id = $${values.length}`);
    }

    if (filters.resourceType) {
      values.push(filters.resourceType);
      conditions.push(`sr.resource_type = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`(sr.title ILIKE $${values.length} OR COALESCE(sr.description, '') ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const offset = filters.page * filters.pageSize;
    values.push(filters.pageSize);
    const limitClause = `LIMIT $${values.length}`;

    values.push(offset);
    const offsetClause = `OFFSET $${values.length}`;

    const result = await this.pool.query<StudyResourceRow>(
      `
        SELECT
          sr.id,
          sr.user_id,
          sr.program_id,
          sr.subject_id,
          sr.resource_type,
          sr.title,
          sr.description,
          sr.url,
          sr.og_title,
          sr.og_description,
          sr.og_image,
          sr.og_scraped_at,
          sr.file_url,
          sr.file_name,
          sr.file_type,
          sr.file_size_kb,
          sr.created_at,
          sr.updated_at,
          p.full_name AS author_full_name,
          p.avatar_url AS author_avatar_url,
          s.name AS subject_name,
          COUNT(*) OVER() AS full_count
        FROM study_resources sr
        LEFT JOIN profiles p ON p.id = sr.user_id
        LEFT JOIN subjects s ON s.id = sr.subject_id
        ${whereClause}
        ORDER BY sr.created_at DESC
        ${limitClause}
        ${offsetClause}
      `,
      values,
    );

    const total = result.rows.length > 0 ? Number(result.rows[0].full_count ?? 0) : 0;
    return { rows: result.rows.map(mapStudyResource), total };
  }

  async getById(id: string): Promise<StudyResource | null> {
    const result = await this.pool.query<StudyResourceRow>(
      `
        SELECT
          sr.id,
          sr.user_id,
          sr.program_id,
          sr.subject_id,
          sr.resource_type,
          sr.title,
          sr.description,
          sr.url,
          sr.og_title,
          sr.og_description,
          sr.og_image,
          sr.og_scraped_at,
          sr.file_url,
          sr.file_name,
          sr.file_type,
          sr.file_size_kb,
          sr.created_at,
          sr.updated_at,
          p.full_name AS author_full_name,
          p.avatar_url AS author_avatar_url,
          s.name AS subject_name
        FROM study_resources sr
        LEFT JOIN profiles p ON p.id = sr.user_id
        LEFT JOIN subjects s ON s.id = sr.subject_id
        WHERE sr.id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ? mapStudyResource(result.rows[0]) : null;
  }

  async create(input: CreateStudyResourceInput): Promise<StudyResource> {
    const insertResult = await this.pool.query<{ id: string }>(
      `
        INSERT INTO study_resources (
          user_id,
          program_id,
          subject_id,
          resource_type,
          title,
          description,
          url,
          og_title,
          og_description,
          og_image,
          og_scraped_at,
          file_url,
          file_name,
          file_type,
          file_size_kb
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `,
      [
        input.userId,
        input.programId,
        input.subjectId,
        input.resourceType,
        input.title,
        input.description ?? null,
        input.url ?? null,
        input.ogTitle ?? null,
        input.ogDescription ?? null,
        input.ogImage ?? null,
        input.ogScrapedAt ? new Date(input.ogScrapedAt).toISOString() : null,
        input.fileUrl ?? null,
        input.fileName ?? null,
        input.fileType ?? null,
        input.fileSizeKb ?? null,
      ],
    );

    const created = await this.getById(insertResult.rows[0].id);
    if (!created) {
      throw new Error("El recurso fue creado pero no pudo ser recuperado.");
    }

    return created;
  }

  async updateById(
    id: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null> {
    const updated = await this.pool.query(
      `
        UPDATE study_resources
        SET
          title = COALESCE($2, title),
          description = CASE WHEN $3::boolean THEN $4 ELSE description END,
          updated_at = now()
        WHERE id = $1
      `,
      [id, payload.title?.trim() || null, payload.description !== undefined, payload.description ?? null],
    );

    if (updated.rowCount === 0) {
      return null;
    }

    return this.getById(id);
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM study_resources WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
