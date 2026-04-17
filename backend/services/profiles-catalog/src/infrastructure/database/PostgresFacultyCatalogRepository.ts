import { Pool } from "pg";
import type { ProfilesCatalogEnv } from "../../config/env.js";
import type { Faculty } from "../../domain/entities/Faculty.js";
import type { Program } from "../../domain/entities/Program.js";
import type { Subject } from "../../domain/entities/Subject.js";
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository.js";

interface FacultyRow {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: Date | string;
}

interface ProgramRow {
  id: string;
  name: string;
  code: string | null;
  faculty_id: string;
  faculty_name: string | null;
  is_active: boolean;
  created_at: Date | string;
}

interface SubjectRow {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  credits: number | null;
  semester: number | null;
  created_at: Date | string;
}

function mapFaculty(row: FacultyRow): Faculty {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    facultyId: row.faculty_id,
    facultyName: row.faculty_name ?? undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    isActive: row.is_active,
    credits: row.credits,
    semester: row.semester,
    createdAt: new Date(row.created_at).toISOString(),
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

export class PostgresFacultyCatalogRepository implements IFacultyCatalogRepository {
  private readonly pool: Pool;

  constructor(env: ProfilesCatalogEnv) {
    this.pool = buildPool(env);
  }

  async getAllFaculties(): Promise<Faculty[]> {
    const result = await this.pool.query<FacultyRow>(
      `SELECT id, name, code, is_active, created_at FROM faculties WHERE is_active = true ORDER BY name ASC`,
    );
    return result.rows.map(mapFaculty);
  }

  async getProgramsByFaculty(facultyId: string): Promise<Program[]> {
    const result = await this.pool.query<ProgramRow>(
      `
        SELECT
          p.id,
          p.name,
          p.code,
          p.faculty_id,
          f.name AS faculty_name,
          p.is_active,
          p.created_at
        FROM programs p
        LEFT JOIN faculties f ON f.id = p.faculty_id
        WHERE p.faculty_id = $1 AND p.is_active = true
        ORDER BY p.name ASC
      `,
      [facultyId],
    );
    return result.rows.map(mapProgram);
  }

  async getSubjectsByProgram(programId: string): Promise<Subject[]> {
    const result = await this.pool.query<SubjectRow>(
      `
        SELECT
          s.id,
          s.name,
          s.code,
          s.is_active,
          s.credits,
          s.semester,
          s.created_at
        FROM subjects s
        JOIN program_subjects ps ON ps.subject_id = s.id
        WHERE ps.program_id = $1 AND s.is_active = true
        ORDER BY s.name ASC
      `,
      [programId],
    );
    return result.rows.map(mapSubject);
  }

  async getAllSubjects(): Promise<Subject[]> {
    const result = await this.pool.query<SubjectRow>(
      `SELECT id, name, code, is_active, credits, semester, created_at FROM subjects WHERE is_active = true ORDER BY name ASC`,
    );
    return result.rows.map(mapSubject);
  }

  async getSubjectById(subjectId: string): Promise<Subject | null> {
    const result = await this.pool.query<SubjectRow>(
      `SELECT id, name, code, is_active, credits, semester, created_at FROM subjects WHERE id = $1 LIMIT 1`,
      [subjectId],
    );
    return result.rows[0] ? mapSubject(result.rows[0]) : null;
  }
}
