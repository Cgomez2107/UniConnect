import { Pool } from "pg";

import type { StudyGroupsEnv } from "../../config/env.js";
import type { AdminTransfer } from "../../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";

interface AdminTransferRow {
  id: string;
  request_id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pendiente" | "aceptada" | "rechazada" | "cancelada";
  created_at: Date | string;
  responded_at: Date | string | null;
}

function buildPool(env: StudyGroupsEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Database environment variables are incomplete for PostgresAdminTransferRepository");
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

function mapTransfer(row: AdminTransferRow): AdminTransfer {
  return {
    id: row.id,
    requestId: row.request_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    respondedAt: row.responded_at ? new Date(row.responded_at).toISOString() : null,
  };
}

export class PostgresAdminTransferRepository implements IAdminTransferRepository {
  private readonly pool: Pool;

  constructor(env: StudyGroupsEnv) {
    this.pool = buildPool(env);
  }

  async getById(transferId: string): Promise<AdminTransfer | null> {
    const result = await this.pool.query<AdminTransferRow>(
      `
        SELECT id, request_id, from_user_id, to_user_id, status, created_at, responded_at
        FROM study_request_admin_transfers
        WHERE id = $1
        LIMIT 1
      `,
      [transferId],
    );

    return result.rows[0] ? mapTransfer(result.rows[0]) : null;
  }

  async requestTransfer(input: {
    requestId: string;
    actorUserId: string;
    targetUserId: string;
  }): Promise<AdminTransfer> {
    const result = await this.pool.query<AdminTransferRow>(
      "SELECT * FROM request_admin_transfer($1, $2, $3)",
      [input.requestId, input.targetUserId, input.actorUserId],
    );

    return mapTransfer(result.rows[0]);
  }

  async acceptTransfer(input: { transferId: string; actorUserId: string }): Promise<void> {
    await this.pool.query("SELECT accept_admin_transfer($1, $2)", [
      input.transferId,
      input.actorUserId,
    ]);
  }

  async leaveAdminRole(input: { requestId: string; actorUserId: string }): Promise<void> {
    await this.pool.query("SELECT leave_request_admin($1, $2)", [
      input.requestId,
      input.actorUserId,
    ]);
  }
}
