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
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size_kb: number | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  author_full_name: string | null;
  author_avatar_url: string | null;
  subject_name: string | null;
}

function mapStudyResource(row: StudyResourceRow): StudyResource {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSizeKb: row.file_size_kb,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image,
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

  async list(filters: ListStudyResourcesFilters): Promise<StudyResource[]> {
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
          sr.title,
          sr.description,
          sr.file_url,
          sr.file_name,
          sr.file_type,
          sr.file_size_kb,
          sr.og_title,
          sr.og_description,
          sr.og_image,
          sr.created_at,
          sr.updated_at,
          p.full_name AS author_full_name,
          p.avatar_url AS author_avatar_url,
          s.name AS subject_name
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

    return result.rows.map(mapStudyResource);
  }

  async getById(id: string): Promise<StudyResource | null> {
    const result = await this.pool.query<StudyResourceRow>(
      `
        SELECT
          sr.id,
          sr.user_id,
          sr.program_id,
          sr.subject_id,
          sr.title,
          sr.description,
          sr.file_url,
          sr.file_name,
          sr.file_type,
          sr.file_size_kb,
          sr.og_title,
          sr.og_description,
          sr.og_image,
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
          title,
          description,
          file_url,
          file_name,
          file_type,
          file_size_kb,
          og_title,
          og_description,
          og_image
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `,
      [
        input.userId,
        input.programId,
        input.subjectId,
        input.title,
        input.description ?? null,
        input.fileUrl,
        input.fileName,
        input.fileType ?? null,
        input.fileSizeKb ?? null,
        input.ogTitle ?? null,
        input.ogDescription ?? null,
        input.ogImage ?? null,
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
    actorUserId: string,
    payload: { title?: string; description?: string | null },
  ): Promise<StudyResource | null> {
    const current = await this.pool.query<{ user_id: string }>(
      "SELECT user_id FROM study_resources WHERE id = $1 LIMIT 1",
      [id],
    );

    if (!current.rows[0]) {
      return null;
    }

    if (current.rows[0].user_id !== actorUserId) {
      throw new Error("Solo el autor puede editar este recurso.");
    }

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

  async deleteById(id: string, actorUserId: string): Promise<boolean> {
    const current = await this.pool.query<{ user_id: string }>(
      "SELECT user_id FROM study_resources WHERE id = $1 LIMIT 1",
      [id],
    );

    if (!current.rows[0]) {
      return false;
    }

    if (current.rows[0].user_id !== actorUserId) {
      throw new Error("Solo el autor puede eliminar este recurso.");
    }

    await this.pool.query("DELETE FROM study_resources WHERE id = $1", [id]);
    return true;
  }
}
