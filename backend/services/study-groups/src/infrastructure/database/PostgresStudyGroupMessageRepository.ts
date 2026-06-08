import type { Pool } from "pg";

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
  poll_data?: any | null;
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
    poll: row.poll_data ?? null,
  };
}

export class PostgresStudyGroupMessageRepository implements IStudyGroupMessageRepository {
  constructor(private readonly pool: Pool) {
    this.initializeModerationTables();
  }

  private async initializeModerationTables(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS study_group_moderation_blocks (
          user_id TEXT PRIMARY KEY,
          blocked_until TIMESTAMP NOT NULL,
          reason TEXT NOT NULL
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS study_group_message_timestamps (
          user_id TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          PRIMARY KEY (user_id, timestamp)
        )
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_study_group_message_timestamps_user
        ON study_group_message_timestamps(user_id)
      `);
    } catch (error) {
      console.error("[PostgresStudyGroupMessageRepository] Error initializing moderation tables:", error);
    }
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
    poll?: {
      question: string;
      options: Array<{ text: string; votes: string[] }>;
      isOpen: boolean;
      closesAt: string | null;
      createdAt: string;
    };
  }): Promise<StudyGroupMessage> {
    const result = await this.pool.query<StudyGroupMessageRow>(
      "SELECT * FROM insert_study_group_message($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        input.requestId,
        input.actorUserId,
        input.content,
        input.mediaUrl || null,
        input.mediaType || null,
        input.mediaFilename || null,
        JSON.stringify(input.mentions || []),
        input.poll ? JSON.stringify(input.poll) : null,
      ],
    );

    return mapMessage(result.rows[0]);
  }

  async toggleReaction(messageId: string, currentUserId: string, emoji: string): Promise<any[]> {
    const msg = await this.pool.query<any>(
      `
      SELECT m.request_id, COALESCE(m.reactions, '[]'::jsonb) AS reactions
      FROM study_group_messages m
      WHERE m.id = $1
      LIMIT 1
      `,
      [messageId],
    );

    if (!msg.rows[0]) {
      throw new Error("Mensaje no encontrado.");
    }

    const { request_id } = msg.rows[0];

    const memberCheck = await this.pool.query<{ is_member: boolean }>(
      `SELECT is_request_member($1, $2) AS is_member`,
      [request_id, currentUserId],
    );

    if (!memberCheck.rows[0]?.is_member) {
      throw new Error("No tienes permisos para reaccionar a este mensaje.");
    }

    const current: any[] = Array.isArray(msg.rows[0].reactions) ? msg.rows[0].reactions : [];
    const existingIdx = current.findIndex((r: any) => r.emoji === emoji && r.userId === currentUserId);

    let updated: any[];
    if (existingIdx >= 0) {
      updated = current.filter((_: any, i: number) => i !== existingIdx);
    } else {
      updated = [...current, { emoji, userId: currentUserId }];
    }

    await this.pool.query(
      `UPDATE study_group_messages SET reactions = $1::jsonb WHERE id = $2`,
      [JSON.stringify(updated), messageId],
    );

    return updated;
  }

  async voteInPoll(messageId: string, userId: string, optionIndex: number): Promise<{ requestId: string; poll: any }> {
    const msg = await this.pool.query<any>(
      `SELECT request_id, poll_data FROM study_group_messages WHERE id = $1 LIMIT 1`,
      [messageId],
    );

    if (!msg.rows[0]) {
      throw new Error("Mensaje no encontrado.");
    }

    const { request_id, poll_data: poll } = msg.rows[0];
    if (!poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    if (!poll.isOpen) {
      throw new Error("La encuesta ya está cerrada.");
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new Error("Opción inválida.");
    }

    // Criterio 5: Verificar si el usuario ya votó en esta encuesta
    const hasVoted = poll.options.some((opt: any) =>
      opt.votes && opt.votes.includes(userId)
    );

    if (hasVoted) {
      throw new Error("Ya has registrado tu voto en esta encuesta. No puedes votar más de una vez.");
    }

    const updatedOptions = poll.options.map((opt: any, i: number) => {
      if (i === optionIndex) {
        const votes = opt.votes ? [...opt.votes, userId] : [userId];
        return { ...opt, votes };
      }
      return opt;
    });

    // Criterio 4: Calcular porcentajes en tiempo real
    const totalVotes = updatedOptions.reduce((sum: number, opt: any) => sum + (opt.votes?.length || 0), 0);
    const optionsWithPercentages = updatedOptions.map((opt: any) => ({
      ...opt,
      percentage: totalVotes > 0 ? ((opt.votes?.length || 0) / totalVotes * 100).toFixed(1) : "0.0",
    }));

    const updatedPoll = { ...poll, options: optionsWithPercentages };

    await this.pool.query(
      `UPDATE study_group_messages SET poll_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(updatedPoll), messageId],
    );

    return { requestId: request_id, poll: updatedPoll };
  }

  async closePoll(messageId: string): Promise<{ requestId: string; poll: any }> {
    const msg = await this.pool.query<any>(
      `SELECT request_id, poll_data FROM study_group_messages WHERE id = $1 LIMIT 1`,
      [messageId],
    );

    if (!msg.rows[0]) {
      throw new Error("Mensaje no encontrado.");
    }

    const { request_id, poll_data: poll } = msg.rows[0];
    if (!poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    const updatedPoll = { ...poll, isOpen: false };

    await this.pool.query(
      `UPDATE study_group_messages SET poll_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(updatedPoll), messageId],
    );

    return { requestId: request_id, poll: updatedPoll };
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const expiration = await this.getUserBlockExpiration(userId);
    return !!expiration;
  }

  async getUserBlockExpiration(userId: string): Promise<Date | null> {
    const result = await this.pool.query<{ blocked_until: Date }>(
      `SELECT blocked_until FROM study_group_moderation_blocks WHERE user_id = $1`,
      [userId],
    );

    if (!result.rows[0]) {
      return null;
    }

    const blockedUntil = new Date(result.rows[0].blocked_until);
    if (new Date() > blockedUntil) {
      await this.pool.query(
        `DELETE FROM study_group_moderation_blocks WHERE user_id = $1`,
        [userId],
      );
      return null;
    }

    return blockedUntil;
  }


  async blockUser(userId: string, durationMinutes: number, reason: string): Promise<void> {
    const until = new Date(Date.now() + durationMinutes * 60000);
    await this.pool.query(
      `INSERT INTO study_group_moderation_blocks (user_id, blocked_until, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET blocked_until = $2, reason = $3`,
      [userId, until, reason],
    );
    console.warn(`[Moderación] Usuario ${userId} bloqueado por ${durationMinutes} minutos. Razón: ${reason}`);
  }

  async recordMessageTimestamp(userId: string): Promise<number> {
    const now = new Date();
    const limitTime = new Date(now.getTime() - 30000);

    await this.pool.query(
      `DELETE FROM study_group_message_timestamps WHERE timestamp < $1`,
      [limitTime],
    );

    await this.pool.query(
      `INSERT INTO study_group_message_timestamps (user_id, timestamp) VALUES ($1, $2)`,
      [userId, now],
    );

    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM study_group_message_timestamps WHERE user_id = $1`,
      [userId],
    );

    return parseInt(result.rows[0].count, 10);
  }
}
