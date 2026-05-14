import type { Pool } from "pg";

import { AuthorizationError, ConflictError } from "../../../../../shared/libs/errors/index.js";
import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

interface ApplicationRow {
  id: string;
  request_id: string;
  applicant_id: string;
  message: string;
  status: "pendiente" | "aceptada" | "rechazada";
  created_at: Date | string;
  reviewed_at: Date | string | null;
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    requestId: row.request_id,
    applicantId: row.applicant_id,
    message: row.message,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  };
}

export class PostgresApplicationRepository implements IApplicationRepository {
  constructor(private readonly pool: Pool) {}

  async getByRequest(requestId: string, actorUserId: string): Promise<Application[]> {
    const adminCheck = await this.pool.query<{ is_request_admin: boolean }>(
      "SELECT is_request_admin($1, $2) AS is_request_admin",
      [requestId, actorUserId],
    );

    if (!adminCheck.rows[0]?.is_request_admin) {
      throw new AuthorizationError("No tienes permisos para ver las postulaciones de esta solicitud.");
    }

    const result = await this.pool.query<ApplicationRow>(
      `
        SELECT id, request_id, applicant_id, message, status, created_at, reviewed_at
        FROM applications
        WHERE request_id = $1
        ORDER BY created_at DESC
      `,
      [requestId],
    );

    return result.rows.map(mapApplication);
  }

  async getById(applicationId: string): Promise<Application | null> {
    const result = await this.pool.query<ApplicationRow>(
      `
        SELECT id, request_id, applicant_id, message, status, created_at, reviewed_at
        FROM applications
        WHERE id = $1
        LIMIT 1
      `,
      [applicationId],
    );

    return result.rows[0] ? mapApplication(result.rows[0]) : null;
  }

  async create(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    // Permitir re-postulación si la anterior fue rechazada
    const existing = await this.pool.query<ApplicationRow>(
      `SELECT id, request_id, applicant_id, message, status, created_at, reviewed_at
       FROM applications
       WHERE request_id = $1 AND applicant_id = $2
       LIMIT 1`,
      [input.requestId, input.applicantId],
    );

    if (existing.rows.length > 0) {
      const app = existing.rows[0];
      if (app.status !== "rechazada") {
        throw new ConflictError("Ya te postulaste a esta solicitud.");
      }
      const updated = await this.pool.query<ApplicationRow>(
        `UPDATE applications
         SET message = $1, status = 'pendiente', reviewed_at = NULL, created_at = NOW()
         WHERE id = $2
         RETURNING id, request_id, applicant_id, message, status, created_at, reviewed_at`,
        [input.message, app.id],
      );
      return mapApplication(updated.rows[0]);
    }

    const result = await this.pool.query<ApplicationRow>(
      `
        INSERT INTO applications (request_id, applicant_id, message)
        VALUES ($1, $2, $3)
        RETURNING id, request_id, applicant_id, message, status, created_at, reviewed_at
      `,
      [input.requestId, input.applicantId, input.message],
    );

    return mapApplication(result.rows[0]);
  }

  async review(input: { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }): Promise<void> {
    await this.pool.query("SELECT review_application_as_author($1, $2, $3)", [
      input.applicationId,
      input.actorUserId,
      input.status,
    ]);
  }

  async getByApplicantId(applicantId: string): Promise<Application[]> {
    const result = await this.pool.query<ApplicationRow>(
      `
        SELECT id, request_id, applicant_id, message, status, created_at, reviewed_at
        FROM applications
        WHERE applicant_id = $1
        ORDER BY created_at DESC
      `,
      [applicantId],
    );

    return result.rows.map(mapApplication);
  }
}