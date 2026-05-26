import type { Pool } from "pg";

import { ConflictError } from "../../../../../shared/libs/errors/ConflictError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type {
  IStudyRequestRepository,
  ListOpenFilters,
} from "../../domain/repositories/IStudyRequestRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";
import { GroupContext } from "../../domain/states/GroupContext.js";
import type { IState } from "../../domain/states/IState.js";
import { Active } from "../../domain/states/Active.js";
import { Dissolved } from "../../domain/states/Dissolved.js";
import { Blocked } from "../../domain/states/Blocked.js";
import { PendingTransfer } from "../../domain/states/PendingTransfer.js";

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
  has_pending_transfer: boolean;
  pending_transfer_id: string | null;
  pending_transfer_to_user_id: string | null;
}

interface StudyGroupHydrationRow {
  id: string;
  author_id: string;
  title: string;
  max_members: number;
  status: "abierta" | "cerrada" | "expirada";
  members_count: number;
  has_pending_transfer: boolean;
  pending_transfer_id: string | null;
  pending_transfer_to_user_id: string | null;
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
      row.applications_count == null
        ? undefined
        : Number(row.applications_count),
    hasPendingTransfer: row.has_pending_transfer,
    pendingTransferId: row.pending_transfer_id ?? undefined,
    pendingTransferToUserId: row.pending_transfer_to_user_id ?? undefined,
    author: row.author_full_name
      ? {
        fullName: row.author_full_name,
        avatarUrl: row.author_avatar_url,
        bio: row.author_bio,
      }
      : undefined,
  };
}

/**
 * Implementación Postgres del repositorio de solicitudes de estudio.
 *
 * Implementa tanto IStudyRequestRepository (operaciones CRUD estándar) como
 * IStudyGroupRepository (hidratación del contexto StudyGroup con el estado correcto).
 *
 * Recibe el Pool de conexiones por inyección de dependencias (Singleton centralizado),
 * lo que garantiza reutilización de recursos y facilita el testing.
 */
export class PostgresStudyRequestRepository
  implements IStudyRequestRepository, IStudyGroupRepository
{
  constructor(private readonly pool: Pool) {}

  // ─── IStudyGroupRepository ────────────────────────────────────────────────

  async loadStudyGroup(requestId: string, subject: ISubject): Promise<GroupContext> {
    const result = await this.pool.query<StudyGroupHydrationRow>(
      `
        SELECT
          sr.id,
          sr.author_id,
          sr.title,
          sr.max_members,
          sr.status,
          COALESCE(m.members_count, 0)::int         AS members_count,
          (t.id IS NOT NULL)                         AS has_pending_transfer,
          t.id                                       AS pending_transfer_id,
          t.to_user_id                               AS pending_transfer_to_user_id
        FROM study_requests sr
        LEFT JOIN (
          SELECT request_id, COUNT(*)::int AS members_count
          FROM   applications
          WHERE  status = 'aceptada'
          GROUP  BY request_id
        ) m ON m.request_id = sr.id
        LEFT JOIN study_request_admin_transfers t
               ON t.request_id = sr.id AND t.status = 'pendiente'
        WHERE sr.id = $1
        LIMIT 1
      `,
      [requestId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundError(`Grupo de estudio '${requestId}' no encontrado.`);
    }

    let baseState: IState =
      row.status === "cerrada"
        ? new Dissolved()
        : row.status === "expirada"
          ? new Blocked()
          : new Active();

    const initialState: IState = row.has_pending_transfer && row.pending_transfer_id && row.pending_transfer_to_user_id
      ? new PendingTransfer(baseState, row.pending_transfer_to_user_id, row.pending_transfer_id)
      : baseState;

    return new GroupContext(
      row.id,
      row.title,
      row.author_id,
      initialState,
      subject,
      row.members_count,
      row.max_members,
    );
  }

  // ─── IStudyRequestRepository ──────────────────────────────────────────────

  async listOpen(filters: ListOpenFilters = {}): Promise<StudyRequest[]> {
    const values: Array<string | number | string[]> = [];
    const conditions = ["sr.status = 'abierta'", "sr.is_active = true"];

    if (filters.subjectIds && filters.subjectIds.length > 0) {
      values.push(filters.subjectIds);
      conditions.push(`sr.subject_id = ANY($${values.length})`);
    } else if (filters.subjectId) {
      values.push(filters.subjectId);
      conditions.push(`sr.subject_id = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(
        `(sr.title ILIKE $${values.length} OR sr.description ILIKE $${values.length})`,
      );
    }

    const page = filters.page ?? 0;
    const pageSize = filters.pageSize ?? 10;
    const offset = page * pageSize;

    values.push(pageSize);
    const limitClause = `LIMIT $${values.length}`;

    values.push(offset);
    const offsetClause = `OFFSET $${values.length}`;

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
          s.name                                        AS subject_name,
          (
            SELECT f.name
            FROM   program_subjects ps
            JOIN   programs         p  ON p.id  = ps.program_id
            JOIN   faculties        f  ON f.id  = p.faculty_id
            WHERE  ps.subject_id = sr.subject_id
            ORDER  BY p.name ASC
            LIMIT  1
          )                                             AS faculty_name,
          COALESCE(a.accepted_count, 0) + 1             AS applications_count,
          pr.full_name                                  AS author_full_name,
          pr.avatar_url                                 AS author_avatar_url,
          pr.bio                                        AS author_bio,
          (t.id IS NOT NULL)                            AS has_pending_transfer
        FROM study_requests sr
        LEFT JOIN subjects  s  ON s.id  = sr.subject_id
        LEFT JOIN profiles  pr ON pr.id = sr.author_id
        LEFT JOIN (
          SELECT request_id, COUNT(*)::int AS accepted_count
          FROM   applications
          WHERE  status = 'aceptada'
          GROUP  BY request_id
        ) a ON a.request_id = sr.id
        LEFT JOIN study_request_admin_transfers t
               ON t.request_id = sr.id AND t.status = 'pendiente'
        WHERE ${conditions.join(" AND ")}
        ORDER BY sr.created_at DESC
        ${limitClause}
        ${offsetClause}
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
          s.name                                        AS subject_name,
          (
            SELECT f.name
            FROM   program_subjects ps
            JOIN   programs         p  ON p.id  = ps.program_id
            JOIN   faculties        f  ON f.id  = p.faculty_id
            WHERE  ps.subject_id = sr.subject_id
            ORDER  BY p.name ASC
            LIMIT  1
          )                                             AS faculty_name,
          COALESCE(a.accepted_count, 0) + 1             AS applications_count,
          pr.full_name                                  AS author_full_name,
          pr.avatar_url                                 AS author_avatar_url,
          pr.bio                                        AS author_bio,
          (t.id IS NOT NULL)                            AS has_pending_transfer,
          t.id                                        AS pending_transfer_id,
          t.to_user_id                                AS pending_transfer_to_user_id
        FROM study_requests sr
        LEFT JOIN subjects  s  ON s.id  = sr.subject_id
        LEFT JOIN profiles  pr ON pr.id = sr.author_id
        LEFT JOIN (
          SELECT request_id, COUNT(*)::int AS accepted_count
          FROM   applications
          WHERE  status = 'aceptada'
          GROUP  BY request_id
        ) a ON a.request_id = sr.id
        LEFT JOIN study_request_admin_transfers t
               ON t.request_id = sr.id AND t.status = 'pendiente'
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
            author_id, subject_id, title, description, max_members, status, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, 'abierta', true, $1)
          RETURNING id
        `,
        [input.authorId, input.subjectId, input.title, input.description, input.maxMembers],
      );

      const created = await this.getById(insertResult.rows[0].id);
      if (!created) {
        throw new Error("La solicitud fue creada pero no pudo ser recuperada.");
      }

      return created;
    } catch (error) {
      if (error instanceof Error && error.message.includes("validate_request_subject")) {
        throw new ValidationError("Solo puedes crear solicitudes de materias que estés cursando actualmente.");
      }
      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        throw new ConflictError("Esta materia ya alcanzó el límite de 3 grupos activos.");
      }
      throw error;
    }
  }

  async countBySubject(subjectId: string): Promise<number> {
    const result = await this.pool.query<{ count: string | number }>(
      "SELECT COUNT(*)::int AS count FROM study_requests WHERE subject_id = $1 AND status = 'abierta' AND is_active = true",
      [subjectId],
    );
    return Number(result.rows[0].count);
  }

  async listByAuthorId(authorId: string): Promise<StudyRequest[]> {
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
          s.name                                        AS subject_name,
          (
            SELECT f.name
            FROM   program_subjects ps
            JOIN   programs         p  ON p.id  = ps.program_id
            JOIN   faculties        f  ON f.id  = p.faculty_id
            WHERE  ps.subject_id = sr.subject_id
            ORDER  BY p.name ASC
            LIMIT  1
          )                                             AS faculty_name,
          COALESCE(a.accepted_count, 0) + 1             AS applications_count,
          pr.full_name                                  AS author_full_name,
          pr.avatar_url                                 AS author_avatar_url,
          pr.bio                                        AS author_bio,
          (t.id IS NOT NULL)                            AS has_pending_transfer
        FROM study_requests sr
        LEFT JOIN subjects  s  ON s.id  = sr.subject_id
        LEFT JOIN profiles  pr ON pr.id = sr.author_id
        LEFT JOIN (
          SELECT request_id, COUNT(*)::int AS accepted_count
          FROM   applications
          WHERE  status = 'aceptada'
          GROUP  BY request_id
        ) a ON a.request_id = sr.id
        LEFT JOIN study_request_admin_transfers t
               ON t.request_id = sr.id AND t.status = 'pendiente'
        WHERE sr.author_id = $1 AND sr.is_active = true
        ORDER BY sr.created_at DESC
      `,
      [authorId],
    );

    return result.rows.map(mapStudyRequest);
  }

  async cancel(id: string, actorUserId: string): Promise<StudyRequest> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError(`Solicitud de estudio '${id}' no encontrada.`);
    }
    if (existing.authorId !== actorUserId) {
      throw new AuthorizationError("Solo el autor puede cancelar la solicitud.");
    }
    if (existing.status !== "abierta") {
      throw new ValidationError("Solo se pueden cancelar solicitudes abiertas.");
    }

    await this.pool.query(
      `UPDATE study_requests
       SET status = 'cerrada', updated_at = NOW()
       WHERE id = $1`,
      [id],
    );

    return { ...existing, status: "cerrada", updatedAt: new Date().toISOString() };
  }
}