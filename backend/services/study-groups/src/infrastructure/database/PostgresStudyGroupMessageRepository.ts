import { Pool } from "pg";

import type { StudyGroupsEnv } from "../../config/env.js";
import type { StudyGroupMessage } from "../../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";

interface StudyGroupMessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  created_at: Date | string;
  sender_full_name: string | null;
  sender_avatar_url: string | null;
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
  mentions?: any[] | null;
  reactions?: any[] | null;
}

function buildPool(env: StudyGroupsEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Database environment variables are incomplete for PostgresStudyGroupMessageRepository");
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

function mapMessage(row: StudyGroupMessageRow): StudyGroupMessage {
  return {
    id: row.id,
    requestId: row.request_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
    senderFullName: row.sender_full_name,
    senderAvatarUrl: row.sender_avatar_url,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    mediaFilename: row.media_filename,
    mentions: row.mentions,
    reactions: row.reactions,
  };
}

export class PostgresStudyGroupMessageRepository implements IStudyGroupMessageRepository {
  private readonly pool: Pool;

  constructor(env: StudyGroupsEnv) {
    this.pool = buildPool(env);
  }

  async listByRequest(input: {
    requestId: string;
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<StudyGroupMessage[]> {
    const offset = input.page * input.pageSize;

    const result = await this.pool.query<StudyGroupMessageRow>(
      "SELECT * FROM get_study_group_messages($1, $2, $3, $4)",
      [input.requestId, input.actorUserId, input.pageSize, offset],
    );

    return result.rows.map(mapMessage);
  }

  async create(input: {
    requestId: string;
    actorUserId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    mediaFilename?: string;
    mentions?: any[];
  }): Promise<StudyGroupMessage> {
    const result = await this.pool.query<StudyGroupMessageRow>(
      "SELECT * FROM insert_study_group_message($1, $2, $3, $4, $5, $6, $7)",
      [
        input.requestId,
        input.actorUserId,
        input.content,
        input.mediaUrl || null,
        input.mediaType || null,
        input.mediaFilename || null,
        JSON.stringify(input.mentions || []),
      ],
    );

    return mapMessage(result.rows[0]);
  }
}
