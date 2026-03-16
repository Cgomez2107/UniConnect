import { Pool } from "pg";

import type { StudyGroupsEnv } from "../../config/env.js";
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

function buildPool(env: StudyGroupsEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Database environment variables are incomplete for PostgresApplicationRepository");
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
  private readonly pool: Pool;

  constructor(env: StudyGroupsEnv) {
    this.pool = buildPool(env);
  }

  async getByRequest(requestId: string, actorUserId: string): Promise<Application[]> {
    const adminCheck = await this.pool.query<{ is_request_admin: boolean }>(
      "SELECT is_request_admin($1, $2) AS is_request_admin",
      [requestId, actorUserId],
    );

    if (!adminCheck.rows[0]?.is_request_admin) {
      throw new Error("No tienes permisos para ver las postulaciones de esta solicitud.");
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

  async create(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    try {
      const result = await this.pool.query<ApplicationRow>(
        `
          INSERT INTO applications (request_id, applicant_id, message)
          VALUES ($1, $2, $3)
          RETURNING id, request_id, applicant_id, message, status, created_at, reviewed_at
        `,
        [input.requestId, input.applicantId, input.message],
      );

      return mapApplication(result.rows[0]);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        throw new Error("Ya te postulaste a esta solicitud.");
      }

      throw error;
    }
  }

  async review(input: { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }): Promise<void> {
    await this.pool.query("SELECT review_application_as_author($1, $2, $3)", [
      input.applicationId,
      input.actorUserId,
      input.status,
    ]);
  }
}