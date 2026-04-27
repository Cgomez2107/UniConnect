import { Pool } from "pg";
import type { ProfilesCatalogEnv } from "../../config/env.js";
import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

interface StudentRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  semester: number | null;
  program_id: string;
  program_name: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface SubjectRow {
  subject_id: string;
  name: string;
}

function mapStudent(row: StudentRow): Student {
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    semester: row.semester,
    programId: row.program_id,
    programName: row.program_name ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function buildPool(env: ProfilesCatalogEnv): Pool {
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
 * Implementación Postgres de IStudentRepository
 * Pool se crea una sola vez (Singleton)
 */
export class PostgresStudentRepository implements IStudentRepository {
  private readonly pool: Pool;

  constructor(env: ProfilesCatalogEnv) {
    this.pool = buildPool(env);
  }

  async searchBySubject(subjectId: string, searchTerm?: string, currentUserId?: string): Promise<Student[]> {
    const values: Array<string> = [subjectId];
    const conditions = ["us.subject_id = $1"];

    if (searchTerm) {
      values.push(`%${searchTerm}%`);
      conditions.push(`pr.full_name ILIKE $${values.length}`);
    }

    if (currentUserId && currentUserId.trim()) {
      values.push(currentUserId.trim());
      conditions.push(`pr.id != $${values.length}`);
    }

    const result = await this.pool.query<StudentRow>(
      `
        SELECT
          pr.id,
          pr.full_name,
          pr.avatar_url,
          pr.bio,
          pr.semester,
          up.program_id,
          p.name AS program_name,
          pr.created_at,
          pr.updated_at
        FROM profiles pr
        JOIN user_subjects us ON us.user_id = pr.id
        JOIN user_programs up ON up.user_id = pr.id AND up.is_primary = true
        JOIN programs p ON p.id = up.program_id
        WHERE ${conditions.join(" AND ")} AND pr.is_active = true
        ORDER BY pr.full_name ASC
      `,
      values,
    );

    return result.rows.map(mapStudent);
  }

  async getById(id: string): Promise<Student | null> {
    const result = await this.pool.query<StudentRow>(
      `
        SELECT
          pr.id,
          pr.full_name,
          pr.avatar_url,
          pr.bio,
          pr.semester,
          up.program_id,
          p.name AS program_name,
          pr.created_at,
          pr.updated_at
        FROM profiles pr
        LEFT JOIN user_programs up ON up.user_id = pr.id AND up.is_primary = true
        LEFT JOIN programs p ON p.id = up.program_id
        WHERE pr.id = $1 AND pr.is_active = true
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ? mapStudent(result.rows[0]) : null;
  }

  async getByUserId(userId: string): Promise<Student | null> {
    return this.getById(userId);
  }

  async getSubjectsByUserId(userId: string): Promise<{ subjectId: string; name: string }[]> {
    const result = await this.pool.query<SubjectRow>(
      `
        SELECT
          us.subject_id,
          s.name
        FROM user_subjects us
        JOIN subjects s ON s.id = us.subject_id
        WHERE us.user_id = $1
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      subjectId: row.subject_id,
      name: row.name,
    }));
  }
}
