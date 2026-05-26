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
  constructor(private readonly pool: Pool) {}

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

    const updatedOptions = poll.options.map((opt: any, i: number) => {
      const cleaned = opt.votes ? opt.votes.filter((uid: string) => uid !== userId) : [];
      if (i === optionIndex) {
        return { ...opt, votes: [...cleaned, userId] };
      }
      return { ...opt, votes: cleaned };
    });

    const updatedPoll = { ...poll, options: updatedOptions };

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
}
