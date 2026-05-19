import type { Pool } from "pg";
import type { Student } from "../../domain/entities/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";

interface StudentRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  semester: number | null;
  program_id: string | null;
  program_name: string | null;
  faculty_name: string | null;
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
    phoneNumber: row.phone_number,
    semester: row.semester,
    programId: row.program_id,
    programName: row.program_name ?? undefined,
    facultyName: row.faculty_name ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/**
 * Implementación Postgres de IStudentRepository
 * Recibe el Pool vía inyección de dependencias
 */
export class PostgresStudentRepository implements IStudentRepository {
  constructor(private readonly pool: Pool) {}

  async searchBySubject(subjectId?: string, searchTerm?: string, currentUserId?: string): Promise<Student[]> {
    const values: Array<string> = [];
    const conditions: string[] = [];
    const joins: string[] = [];
    let paramIndex = 0;

    if (subjectId) {
      paramIndex++;
      values.push(subjectId);
      conditions.push(`us.subject_id = $${paramIndex}`);
      joins.push(`JOIN user_subjects us ON us.user_id = pr.id`);
    }

    if (searchTerm) {
      paramIndex++;
      values.push(`%${searchTerm}%`);
      conditions.push(`pr.full_name ILIKE $${paramIndex}`);
    }

    if (currentUserId && currentUserId.trim()) {
      paramIndex++;
      values.push(currentUserId.trim());
      conditions.push(`pr.id != $${paramIndex}`);
    }

    // Si no hay filtro de materia, no filtrar por user_subjects
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")} AND pr.is_active = true`
      : "WHERE pr.is_active = true";

    const result = await this.pool.query<StudentRow>(
      `
        SELECT DISTINCT ON (pr.id)
          pr.id,
          pr.full_name,
          pr.avatar_url,
          pr.bio,
          pr.phone_number,
          pr.semester,
          up.program_id,
          p.name AS program_name,
          f.name AS faculty_name,
          pr.created_at,
          pr.updated_at
        FROM profiles pr
        ${joins.join("\n        ")}
        JOIN user_programs up ON up.user_id = pr.id AND up.is_primary = true
        JOIN programs p ON p.id = up.program_id
        LEFT JOIN faculties f ON f.id = p.faculty_id
        ${whereClause}
        ORDER BY pr.id, pr.full_name ASC
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
          pr.phone_number,
          pr.semester,
          up.program_id,
          p.name AS program_name,
          f.name AS faculty_name,
          pr.created_at,
          pr.updated_at
        FROM profiles pr
        LEFT JOIN user_programs up ON up.user_id = pr.id AND up.is_primary = true
        LEFT JOIN programs p ON p.id = up.program_id
        LEFT JOIN faculties f ON f.id = p.faculty_id
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

  async getMyPrograms(userId: string): Promise<Array<{ id: string; name: string; isPrimary: boolean; facultyName: string | null }>> {
    const result = await this.pool.query(
      `
        SELECT
          p.id,
          p.name,
          up.is_primary AS "isPrimary",
          f.name AS "facultyName"
        FROM user_programs up
        JOIN programs p ON p.id = up.program_id
        LEFT JOIN faculties f ON f.id = p.faculty_id
        WHERE up.user_id = $1
        ORDER BY up.is_primary DESC, p.name ASC
      `,
      [userId],
    );

    return result.rows;
  }

  async create(data: { id: string; fullName: string; role?: string; isActive?: boolean }): Promise<Student> {
    const result = await this.pool.query<StudentRow>(
      `INSERT INTO profiles (id, full_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, full_name, avatar_url, bio, phone_number, semester, NULL AS program_id, NULL AS program_name, NULL AS faculty_name, created_at, updated_at`,
      [data.id, data.fullName, data.role ?? "estudiante", data.isActive ?? true],
    );
    return mapStudent(result.rows[0]);
  }

  async update(id: string, data: { fullName?: string; bio?: string | null; phoneNumber?: string | null; avatarUrl?: string | null; semester?: number | null }): Promise<Student | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) {
      setClauses.push(`full_name = $${paramIndex++}`);
      values.push(data.fullName);
    }
    if (data.bio !== undefined) {
      setClauses.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }
    if (data.phoneNumber !== undefined) {
      setClauses.push(`phone_number = $${paramIndex++}`);
      values.push(data.phoneNumber);
    }
    if (data.avatarUrl !== undefined) {
      setClauses.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatarUrl);
    }
    if (data.semester !== undefined) {
      setClauses.push(`semester = $${paramIndex++}`);
      values.push(data.semester);
    }

    if (setClauses.length === 0) {
      return this.getById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query<StudentRow>(
      `UPDATE profiles SET ${setClauses.join(", ")} WHERE id = $${paramIndex} AND is_active = true
       RETURNING id, full_name, avatar_url, bio, phone_number, semester,
                 (SELECT up.program_id FROM user_programs up WHERE up.user_id = profiles.id AND up.is_primary = true LIMIT 1) AS program_id,
                 (SELECT p.name FROM user_programs up JOIN programs p ON p.id = up.program_id WHERE up.user_id = profiles.id AND up.is_primary = true LIMIT 1) AS program_name,
                 (SELECT f.name FROM user_programs up JOIN programs p ON p.id = up.program_id LEFT JOIN faculties f ON f.id = p.faculty_id WHERE up.user_id = profiles.id AND up.is_primary = true LIMIT 1) AS faculty_name,
                 created_at, updated_at`,
      values,
    );

    if (result.rows.length === 0) return null;

    return mapStudent(result.rows[0]);
  }

  async setPrimaryProgram(userId: string, programId: string): Promise<void> {
    await this.pool.query("SELECT set_primary_program($1, $2)", [userId, programId]);
  }

  async addSubject(userId: string, subjectId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_subjects (user_id, subject_id, enrolled_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, subjectId],
    );
  }

  async removeSubject(userId: string, subjectId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM user_subjects WHERE user_id = $1 AND subject_id = $2`,
      [userId, subjectId],
    );
  }
}
