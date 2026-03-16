import { Pool } from "pg";

import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import type { StudyGroupsEnv } from "../../config/env.js";

interface StudyRequestRow {
  id: string;
  author_id: string;
  subject_id: string;
  title: string;
  description: string;
  max_members: number;
  status: "abierta" | "cerrada" | "expirada";
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  subject_name: string | null;
  faculty_name: string | null;
  applications_count: number | string | null;
  author_full_name: string | null;
  author_avatar_url: string | null;
  author_bio: string | null;
}

function mapStudyRequest(row: StudyRequestRow): StudyRequest {
  return {
    id: row.id,
    authorId: row.author_id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description,
    maxMembers: row.max_members,
    status: row.status,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    subjectName: row.subject_name ?? undefined,
    facultyName: row.faculty_name ?? undefined,
    applicationsCount:
      row.applications_count === null || row.applications_count === undefined
        ? undefined
        : Number(row.applications_count),
    author: row.author_full_name
      ? {
          fullName: row.author_full_name,
          avatarUrl: row.author_avatar_url,
          bio: row.author_bio,
        }
      : undefined,
  };
}

function buildPool(env: StudyGroupsEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Database environment variables are incomplete for PostgresStudyRequestRepository");
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
 * Postgres adapter for study requests.
 * It mirrors the current Supabase-backed read model while moving access into the service.
 */
export class PostgresStudyRequestRepository implements IStudyRequestRepository {
  private readonly pool: Pool;

  constructor(env: StudyGroupsEnv) {
    this.pool = buildPool(env);
  }

  async listOpen(filters: { subjectId?: string; search?: string } = {}): Promise<StudyRequest[]> {
    const values: Array<string> = [];
    const conditions = ["sr.status = 'abierta'", "sr.is_active = true"];

    if (filters.subjectId) {
      values.push(filters.subjectId);
      conditions.push(`sr.subject_id = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`(sr.title ILIKE $${values.length} OR sr.description ILIKE $${values.length})`);
    }

    const result = await this.pool.query<StudyRequestRow>(
      `
        SELECT
          sr.id,
          sr.author_id,
          sr.subject_id,
          sr.title,
          sr.description,
          sr.max_members,
          sr.status,
          sr.is_active,
          sr.created_at,
          sr.updated_at,
          s.name AS subject_name,
          (
            SELECT f.name
            FROM program_subjects ps
            JOIN programs p ON p.id = ps.program_id
            JOIN faculties f ON f.id = p.faculty_id
            WHERE ps.subject_id = sr.subject_id
            ORDER BY p.name ASC
            LIMIT 1
          ) AS faculty_name,
          COALESCE(a.accepted_count, 0) + 1 AS applications_count,
          pr.full_name AS author_full_name,
          pr.avatar_url AS author_avatar_url,
          pr.bio AS author_bio
        FROM study_requests sr
        LEFT JOIN subjects s ON s.id = sr.subject_id
        LEFT JOIN profiles pr ON pr.id = sr.author_id
        LEFT JOIN (
          SELECT request_id, COUNT(*)::int AS accepted_count
          FROM applications
          WHERE status = 'aceptada'
          GROUP BY request_id
        ) a ON a.request_id = sr.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY sr.created_at DESC
      `,
      values,
    );

    return result.rows.map(mapStudyRequest);
  }

  async getById(id: string): Promise<StudyRequest | null> {
    const result = await this.pool.query<StudyRequestRow>(
      `
        SELECT
          sr.id,
          sr.author_id,
          sr.subject_id,
          sr.title,
          sr.description,
          sr.max_members,
          sr.status,
          sr.is_active,
          sr.created_at,
          sr.updated_at,
          s.name AS subject_name,
          (
            SELECT f.name
            FROM program_subjects ps
            JOIN programs p ON p.id = ps.program_id
            JOIN faculties f ON f.id = p.faculty_id
            WHERE ps.subject_id = sr.subject_id
            ORDER BY p.name ASC
            LIMIT 1
          ) AS faculty_name,
          COALESCE(a.accepted_count, 0) + 1 AS applications_count,
          pr.full_name AS author_full_name,
          pr.avatar_url AS author_avatar_url,
          pr.bio AS author_bio
        FROM study_requests sr
        LEFT JOIN subjects s ON s.id = sr.subject_id
        LEFT JOIN profiles pr ON pr.id = sr.author_id
        LEFT JOIN (
          SELECT request_id, COUNT(*)::int AS accepted_count
          FROM applications
          WHERE status = 'aceptada'
          GROUP BY request_id
        ) a ON a.request_id = sr.id
        WHERE sr.id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ? mapStudyRequest(result.rows[0]) : null;
  }

  async create(input: {
    authorId: string;
    subjectId: string;
    title: string;
    description: string;
    maxMembers: number;
  }): Promise<StudyRequest> {
    try {
      const insertResult = await this.pool.query<{ id: string }>(
        `
          INSERT INTO study_requests (
            author_id,
            subject_id,
            title,
            description,
            max_members,
            status,
            is_active
          ) VALUES ($1, $2, $3, $4, $5, 'abierta', true)
          RETURNING id
        `,
        [input.authorId, input.subjectId, input.title, input.description, input.maxMembers],
      );

      const created = await this.getById(insertResult.rows[0].id);
      if (!created) {
        throw new Error("Study request was created but could not be reloaded");
      }

      return created;
    } catch (error) {
      if (error instanceof Error && error.message.includes("validate_request_subject")) {
        throw new Error("Solo puedes crear solicitudes de materias que estes cursando actualmente.");
      }

      throw error;
    }
  }
}