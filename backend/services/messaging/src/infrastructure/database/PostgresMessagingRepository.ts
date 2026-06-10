import type { Pool } from "pg";

import type {
  ConversationSummary,
  CreateConversationInput,
} from "../../domain/entities/Conversation.js";
import type { CreateMessageInput, Message, PollData, Reaction } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type {
  CreatePollConfigInput,
  PollConfigDTO,
  PollOptionResult,
  PollResultsDTO,
  VoteResultDTO,
} from "../../interfaces/http/dto/PollDTOs.js";
import { DuplicateVoteError } from "../../domain/errors/DuplicateVoteError.js";
import { PollClosedError } from "../../domain/errors/PollClosedError.js";

interface ConversationRow {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string | Date;
  updated_at: string | Date;
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message: string | null;
  last_message_at: string | Date | null;
  unread_count: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  media_filename: string | null;
  reply_to_message_id: string | null;
  reply_preview: string | null;
  created_at: string | Date;
  read_at: string | Date | null;
  reactions: string | null;
  poll_data: string | null;
  sender_full_name: string | null;
  sender_avatar_url: string | null;
}

interface PollConfigRow {
  id: string;
  message_id: string;
  group_id: string;
  created_by: string;
  question: string;
  options: string;
  expires_at: string | Date;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
}

const LEGACY_IMAGE_PREFIX = "__img__:";

function decodeLegacyMediaContent(content: string): { content: string; mediaUrl: string | null } {
  if (!content.startsWith(LEGACY_IMAGE_PREFIX)) {
    return { content, mediaUrl: null };
  }

  const payload = content.slice(LEGACY_IMAGE_PREFIX.length);
  const separatorIndex = payload.indexOf("|");

  if (separatorIndex < 0) {
    return {
      content: "",
      mediaUrl: payload || null,
    };
  }

  return {
    mediaUrl: payload.slice(0, separatorIndex) || null,
    content: payload.slice(separatorIndex + 1),
  };
}

function buildLegacyMediaContent(content: string, mediaUrl: string | undefined): string {
  const cleanContent = content.trim();
  const cleanMediaUrl = mediaUrl?.trim();

  if (!cleanMediaUrl) {
    return cleanContent;
  }

  const encoded = `${LEGACY_IMAGE_PREFIX}${cleanMediaUrl}${cleanContent ? `|${cleanContent}` : ""}`;
  return encoded.slice(0, 1000);
}

function mapConversation(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    participantA: row.participant_a,
    participantB: row.participant_b,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    otherUserId: row.other_user_id,
    otherUserName: row.other_user_name ?? "Usuario",
    otherUserAvatar: row.other_user_avatar,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at ? new Date(row.last_message_at).toISOString() : null,
    unreadCount: Number(row.unread_count) || 0,
  };
}

function parseReactions(raw: unknown): Reaction[] {
  if (Array.isArray(raw)) return raw as Reaction[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Reaction[];
    } catch {
      return [];
    }
  }
  return [];
}

function parsePoll(raw: unknown): PollData | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.options)) {
        return parsed as PollData;
      }
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && raw !== null && Array.isArray((raw as any).options)) {
    return raw as PollData;
  }
  return null;
}

function mapMessage(row: MessageRow): Message {
  const rawContent = row.content ?? "";
  const legacy = decodeLegacyMediaContent(rawContent);
  const resolvedMediaUrl = row.media_url ?? legacy.mediaUrl;
  const resolvedContent = row.media_url ? rawContent : legacy.content;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: resolvedContent,
    mediaUrl: resolvedMediaUrl,
    mediaType: row.media_type,
    mediaFilename: row.media_filename,
    replyToMessageId: row.reply_to_message_id,
    replyPreview: row.reply_preview,
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    reactions: parseReactions(row.reactions),
    poll: parsePoll(row.poll_data),
    sender: {
      fullName: row.sender_full_name ?? "Usuario",
      avatarUrl: row.sender_avatar_url,
    },
  };
}

function parseJsonColumn<T>(raw: unknown): T {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }
  return raw as T;
}

export class PostgresMessagingRepository implements IMessagingRepository {
  private readonly messageTimestamps = new Map<string, Date[]>();
  private readonly blockedUsers = new Map<string, { until: Date; reason: string }>();
  private readonly blockHistory: { userId: string; reason: string; timestamp: Date }[] = [];

  constructor(private readonly pool: Pool) {}

  async getConversationById(id: string, currentUserId: string): Promise<ConversationSummary | null> {
    const result = await this.pool.query<ConversationRow>(
      `
        SELECT
          c.id,
          c.participant_a,
          c.participant_b,
          c.created_at,
          c.updated_at,
          CASE WHEN c.participant_a = $2 THEN c.participant_b ELSE c.participant_a END AS other_user_id,
          p.full_name AS other_user_name,
          p.avatar_url AS other_user_avatar,
          lm.content AS last_message,
          lm.created_at AS last_message_at,
          COALESCE(uc.unread_count, 0) AS unread_count
        FROM conversations c
        LEFT JOIN profiles p
          ON p.id = CASE WHEN c.participant_a = $2 THEN c.participant_b ELSE c.participant_a END
        LEFT JOIN LATERAL (
          SELECT
            COALESCE(
              CASE WHEN m.content LIKE '__img__:%' THEN '📷 Foto' END,
              NULLIF(m.content, ''),
              CASE WHEN (to_jsonb(m)->>'media_url') IS NOT NULL THEN '📷 Foto' END
            ) AS content,
            m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) lm ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS unread_count
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.read_at IS NULL
            AND m.sender_id <> $2
        ) uc ON true
        WHERE c.id = $1
          AND (c.participant_a = $2 OR c.participant_b = $2)
        LIMIT 1
      `,
      [id, currentUserId],
    );

    return result.rows[0] ? mapConversation(result.rows[0]) : null;
  }

  async listConversationsByUser(userId: string): Promise<ConversationSummary[]> {
    const result = await this.pool.query<ConversationRow>(
      `
        SELECT
          c.id,
          c.participant_a,
          c.participant_b,
          c.created_at,
          c.updated_at,
          CASE WHEN c.participant_a = $1 THEN c.participant_b ELSE c.participant_a END AS other_user_id,
          p.full_name AS other_user_name,
          p.avatar_url AS other_user_avatar,
          lm.content AS last_message,
          lm.created_at AS last_message_at,
          COALESCE(uc.unread_count, 0) AS unread_count
        FROM conversations c
        LEFT JOIN profiles p
          ON p.id = CASE WHEN c.participant_a = $1 THEN c.participant_b ELSE c.participant_a END
        LEFT JOIN LATERAL (
          SELECT
            COALESCE(
              CASE WHEN m.content LIKE '__img__:%' THEN '📷 Foto' END,
              NULLIF(m.content, ''),
              CASE WHEN (to_jsonb(m)->>'media_url') IS NOT NULL THEN '📷 Foto' END
            ) AS content,
            m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) lm ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS unread_count
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.read_at IS NULL
            AND m.sender_id <> $1
        ) uc ON true
        WHERE c.participant_a = $1 OR c.participant_b = $1
        ORDER BY COALESCE(lm.created_at, c.updated_at) DESC, c.updated_at DESC
      `,
      [userId],
    );

    return result.rows.map(mapConversation);
  }

  async getOrCreateConversation(input: CreateConversationInput): Promise<ConversationSummary> {
    const normalized = [input.participantA, input.participantB].sort();
    const participantA = normalized[0];
    const participantB = normalized[1];

    const existing = await this.pool.query<{ id: string }>(
      `
        SELECT id
        FROM conversations
        WHERE participant_a = $1 AND participant_b = $2
        LIMIT 1
      `,
      [participantA, participantB],
    );

    const id = existing.rows[0]?.id;

    if (id) {
      const found = await this.getConversationById(id, input.currentUserId);
      if (!found) {
        throw new Error("No se pudo recuperar la conversacion existente.");
      }
      return found;
    }

    const inserted = await this.pool.query<{ id: string }>(
      `
        INSERT INTO conversations (participant_a, participant_b)
        VALUES ($1, $2)
        RETURNING id
      `,
      [participantA, participantB],
    );

    const created = await this.getConversationById(inserted.rows[0].id, input.currentUserId);
    if (!created) {
      throw new Error("La conversacion fue creada pero no pudo recuperarse.");
    }

    return created;
  }

  async touchConversation(conversationId: string, currentUserId: string): Promise<void> {
    const touched = await this.pool.query(
      `
        UPDATE conversations c
        SET updated_at = now()
        WHERE c.id = $1
          AND (c.participant_a = $2 OR c.participant_b = $2)
      `,
      [conversationId, currentUserId],
    );

    if (touched.rowCount === 0) {
      throw new Error("Conversacion no encontrada o sin permisos.");
    }
  }

  async getMessageById(id: string, currentUserId: string): Promise<Message | null> {
    const result = await this.pool.query<MessageRow>(
      `
        SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          to_jsonb(m)->>'media_url' AS media_url,
          to_jsonb(m)->>'media_type' AS media_type,
          to_jsonb(m)->>'media_filename' AS media_filename,
          to_jsonb(m)->>'reply_to_message_id' AS reply_to_message_id,
          to_jsonb(m)->>'reply_preview' AS reply_preview,
          m.created_at,
          m.read_at,
          COALESCE(to_jsonb(m)->>'reactions', '[]') AS reactions,
          to_jsonb(m)->>'poll_data' AS poll_data,
          p.full_name AS sender_full_name,
          p.avatar_url AS sender_avatar_url
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        LEFT JOIN profiles p ON p.id = m.sender_id
        WHERE m.id = $1
          AND (c.participant_a = $2 OR c.participant_b = $2)
        LIMIT 1
      `,
      [id, currentUserId],
    );

    return result.rows[0] ? mapMessage(result.rows[0]) : null;
  }

  async listMessages(
    conversationId: string,
    currentUserId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> {
    const allowed = await this.pool.query<{ id: string }>(
      `
        SELECT id
        FROM conversations
        WHERE id = $1
          AND (participant_a = $2 OR participant_b = $2)
        LIMIT 1
      `,
      [conversationId, currentUserId],
    );

    if (!allowed.rows[0]) {
      throw new Error("No tienes permisos para acceder a estos mensajes.");
    }

    const result = await this.pool.query<MessageRow>(
      `
        SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          to_jsonb(m)->>'media_url' AS media_url,
          to_jsonb(m)->>'media_type' AS media_type,
          to_jsonb(m)->>'media_filename' AS media_filename,
          to_jsonb(m)->>'reply_to_message_id' AS reply_to_message_id,
          to_jsonb(m)->>'reply_preview' AS reply_preview,
          m.created_at,
          m.read_at,
          COALESCE(to_jsonb(m)->>'reactions', '[]') AS reactions,
          to_jsonb(m)->>'poll_data' AS poll_data,
          p.full_name AS sender_full_name,
          p.avatar_url AS sender_avatar_url
        FROM messages m
        LEFT JOIN profiles p ON p.id = m.sender_id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [conversationId, limit, offset],
    );

    return result.rows.map(mapMessage);
  }

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const isParticipant = await this.pool.query<{ id: string }>(
      `
        SELECT id
        FROM conversations
        WHERE id = $1
          AND (participant_a = $2 OR participant_b = $2)
        LIMIT 1
      `,
      [input.conversationId, input.senderId],
    );

    if (!isParticipant.rows[0]) {
      throw new Error("No tienes permisos para enviar mensajes en esta conversacion.");
    }

    const normalizedContent = input.content.trim();
    const legacySafeContent = buildLegacyMediaContent(normalizedContent, input.mediaUrl);

    let insertedId: string;

    try {
      const inserted = await this.pool.query<{ id: string }>(
        `
          INSERT INTO messages (
            conversation_id,
            sender_id,
            content,
            media_url,
            media_type,
            media_filename,
            reply_to_message_id,
            reply_preview,
            poll_data
          )
          VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), $9::jsonb)
          RETURNING id
        `,
        [
          input.conversationId,
          input.senderId,
          normalizedContent,
          input.mediaUrl ?? "",
          input.mediaType ?? "",
          input.mediaFilename ?? "",
          input.replyToMessageId ?? "",
          input.replyPreview ?? "",
          input.poll ? JSON.stringify(input.poll) : null,
        ],
      );

      insertedId = inserted.rows[0].id;
    } catch (error) {
      try {
        const legacyInserted = await this.pool.query<{ id: string }>(
          `
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES ($1, $2, NULLIF($3, ''))
            RETURNING id
          `,
          [input.conversationId, input.senderId, legacySafeContent],
        );

        insertedId = legacyInserted.rows[0].id;
      } catch {
        throw error;
      }
    }

    await this.pool.query(
      `
        UPDATE conversations
        SET updated_at = now()
        WHERE id = $1
      `,
      [input.conversationId],
    );

    const created = await this.getMessageById(insertedId, input.senderId);
    if (!created) {
      throw new Error("El mensaje fue creado pero no pudo recuperarse.");
    }

    return created;
  }

  async markMessageAsRead(messageId: string, currentUserId: string): Promise<boolean> {
    const updated = await this.pool.query(
      `
        UPDATE messages m
        SET read_at = COALESCE(m.read_at, now())
        FROM conversations c
        WHERE m.id = $1
          AND c.id = m.conversation_id
          AND (c.participant_a = $2 OR c.participant_b = $2)
          AND m.sender_id <> $2
      `,
      [messageId, currentUserId],
    );

    if ((updated.rowCount ?? 0) > 0) {
      return true;
    }

    const exists = await this.pool.query<{ id: string }>(
      `
        SELECT m.id
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = $1
          AND (c.participant_a = $2 OR c.participant_b = $2)
        LIMIT 1
      `,
      [messageId, currentUserId],
    );

    return !!exists.rows[0];
  }

  async markConversationAsRead(conversationId: string, currentUserId: string): Promise<number> {
    const conversationCheck = await this.pool.query<{ id: string }>(
      `
        SELECT c.id
        FROM conversations c
        WHERE c.id = $1
          AND (c.participant_a = $2 OR c.participant_b = $2)
        LIMIT 1
      `,
      [conversationId, currentUserId],
    );

    if (!conversationCheck.rows[0]) {
      throw new Error("No tienes permisos para acceder a esta conversacion.");
    }

    const updated = await this.pool.query(
      `
        UPDATE messages m
        SET read_at = now()
        FROM conversations c
        WHERE c.id = $1
          AND m.conversation_id = c.id
          AND m.sender_id <> $2
          AND m.read_at IS NULL
      `,
      [conversationId, currentUserId],
    );

    return updated.rowCount ?? 0;
  }

  async getUnreadCountForUser(currentUserId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `
        SELECT COUNT(*) AS count
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.participant_a = $1 OR c.participant_b = $1)
          AND m.sender_id <> $1
          AND m.read_at IS NULL
      `,
      [currentUserId],
    );

    return parseInt(result.rows[0]?.count ?? "0", 10);
  }

  async toggleReaction(messageId: string, currentUserId: string, emoji: string) {
    const msg = await this.pool.query<{ conversation_id: string; reactions: string | null }>(
      `
      SELECT m.conversation_id, COALESCE(m.reactions, '[]'::jsonb) AS reactions
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = $1
        AND (c.participant_a = $2 OR c.participant_b = $2)
      LIMIT 1
      `,
      [messageId, currentUserId],
    );

    if (!msg.rows[0]) {
      throw new Error("Mensaje no encontrado o sin permisos.");
    }

    const current: Reaction[] = parseReactions(msg.rows[0].reactions);
    const existingIdx = current.findIndex((r) => r.emoji === emoji && r.userId === currentUserId);

    let updated: Reaction[];
    if (existingIdx >= 0) {
      updated = current.filter((_, i) => i !== existingIdx);
    } else {
      updated = [...current, { emoji, userId: currentUserId }];
    }

    await this.pool.query(
      `UPDATE messages SET reactions = $1::jsonb WHERE id = $2`,
      [JSON.stringify(updated), messageId],
    );

    return { conversationId: msg.rows[0].conversation_id, reactions: updated };
  }

  async voteInPoll(messageId: string, userId: string, optionIndex: number) {
    const msg = await this.pool.query<{
      conversation_id: string;
      poll_data: string | null;
    }>(
      `
      SELECT m.conversation_id, to_jsonb(m)->>'poll_data' AS poll_data
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = $1
        AND (c.participant_a = $2 OR c.participant_b = $2)
      LIMIT 1
      `,
      [messageId, userId],
    );

    if (!msg.rows[0]) {
      throw new Error("Mensaje no encontrado o sin permisos.");
    }

    const poll = parsePoll(msg.rows[0].poll_data);
    if (!poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    if (!poll.isOpen) {
      throw new Error("La encuesta ya está cerrada.");
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new Error("Opción inválida.");
    }

    const alreadyVoted = poll.options.some((opt) => opt.votes.includes(userId));
    if (alreadyVoted) {
      throw new Error("Ya has votado en esta encuesta.");
    }

    const updatedOptions = poll.options.map((opt, i) => {
      if (i === optionIndex) {
        return { ...opt, votes: [...opt.votes, userId] };
      }
      return opt;
    });

    const updatedPoll = { ...poll, options: updatedOptions };

    await this.pool.query(
      `UPDATE messages SET poll_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(updatedPoll), messageId],
    );

    return { conversationId: msg.rows[0].conversation_id, poll: updatedPoll };
  }

  async closePoll(messageId: string) {
    const msg = await this.pool.query<{
      conversation_id: string;
      poll_data: string | null;
    }>(
      `
      SELECT m.conversation_id, to_jsonb(m)->>'poll_data' AS poll_data
      FROM messages m
      WHERE m.id = $1
      LIMIT 1
      `,
      [messageId],
    );

    if (!msg.rows[0]) {
      throw new Error("Mensaje no encontrado.");
    }

    const poll = parsePoll(msg.rows[0].poll_data);
    if (!poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    const updatedPoll = { ...poll, isOpen: false };

    await this.pool.query(
      `UPDATE messages SET poll_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(updatedPoll), messageId],
    );

    return { conversationId: msg.rows[0].conversation_id, poll: updatedPoll };
  }

  async createPollConfig(input: CreatePollConfigInput): Promise<PollConfigDTO> {
    const result = await this.pool.query<PollConfigRow>(
      `
        INSERT INTO poll_configs (message_id, group_id, created_by, question, options, expires_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)
        RETURNING id, message_id, group_id, created_by, question, options, expires_at, status, created_at, updated_at
      `,
      [
        input.messageId,
        input.groupId,
        input.createdBy,
        input.question,
        JSON.stringify(input.options),
        input.expiresAt,
      ],
    );

    const row = result.rows[0];
    const options: string[] = parseJsonColumn<string[]>(row.options);
    const results = await this.getPollResults(row.id);

    return {
      pollId: row.id,
      messageId: row.message_id,
      groupId: row.group_id,
      createdBy: row.created_by,
      question: row.question,
      options,
      expiresAt: new Date(row.expires_at).toISOString(),
      status: row.status as 'active' | 'closed',
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      results: results.results,
      totalVotes: results.totalVotes,
    };
  }

  async castVote(pollId: string, userId: string, selectedOption: number): Promise<VoteResultDTO> {
    try {
      const result = await this.pool.query<{ cast_vote: string }>(
        `SELECT cast_vote($1::uuid, $2::uuid, $3::int) AS cast_vote`,
        [pollId, userId, selectedOption],
      );

      const raw = result.rows[0].cast_vote;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

      return {
        success: parsed.success as boolean,
        pollId: parsed.pollId as string,
        userId: parsed.userId as string,
        selectedOption: parsed.selectedOption as number,
        results: parsed.results as PollOptionResult[],
        totalVotes: parsed.totalVotes as number,
      };
    } catch (error: unknown) {
      const pgError = error as { code?: string; message?: string };
      if (pgError.code === '23505') {
        throw new DuplicateVoteError();
      }
      if (pgError.code === 'P0001' && pgError.message
        ?.match(/cerrada|expirado|expir/i)) {
        throw new PollClosedError();
      }
      throw error;
    }
  }

  async getPollResults(pollId: string): Promise<PollResultsDTO> {
    const result = await this.pool.query<{ get_poll_results: string }>(
      `SELECT get_poll_results($1::uuid) AS get_poll_results`,
      [pollId],
    );

    const raw = result.rows[0].get_poll_results;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return {
      pollId: parsed.pollId as string,
      question: parsed.question as string,
      status: parsed.status as 'active' | 'closed',
      results: parsed.results as PollOptionResult[],
      totalVotes: parsed.totalVotes as number,
    };
  }

  async closeExpiredPolls(): Promise<string[]> {
    const result = await this.pool.query<{ close_expired_polls: string }>(
      `SELECT close_expired_polls() AS close_expired_polls`,
    );

    const raw = result.rows[0].close_expired_polls;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return parsed.closedPollIds as string[];
  }

  async getPollGroupId(pollId: string): Promise<string> {
    const result = await this.pool.query<{ group_id: string }>(
      `SELECT group_id FROM poll_configs WHERE id = $1 LIMIT 1`,
      [pollId],
    );

    if (!result.rows[0]) {
      throw new Error(`Encuesta no encontrada: ${pollId}`);
    }

    return result.rows[0].group_id;
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const expiration = await this.getUserBlockExpiration(userId);
    return !!expiration;
  }

  async getUserBlockExpiration(userId: string): Promise<Date | null> {
    const block = this.blockedUsers.get(userId);
    if (!block) {
      return null;
    }

    if (new Date() < block.until) {
      return block.until;
    }

    this.blockedUsers.delete(userId);
    return null;
  }


  async blockUser(userId: string, durationMinutes: number, reason: string): Promise<void> {
    const until = new Date(Date.now() + durationMinutes * 60000);
    this.blockedUsers.set(userId, { until, reason });
    console.warn(`[Moderación] Usuario ${userId} bloqueado por ${durationMinutes} minutos. Razón: ${reason}`);
  }

  async recordMessageTimestamp(userId: string): Promise<number> {
    const now = new Date();
    const limitTime = new Date(now.getTime() - 30000);

    const userTimestamps = this.messageTimestamps.get(userId) ?? [];
    const recentTimestamps = userTimestamps.filter((t) => t >= limitTime);
    recentTimestamps.push(now);

    this.messageTimestamps.set(userId, recentTimestamps);
    return recentTimestamps.length;
  }

  async recordBlockEvent(userId: string, reason: string): Promise<void> {
    this.blockHistory.push({ userId, reason, timestamp: new Date() });
  }

  async countBlocksInLastHour(userId: string): Promise<number> {
    const limitTime = new Date(Date.now() - 60 * 60 * 1000);
    return this.blockHistory.filter((item) => item.userId === userId && item.timestamp >= limitTime).length;
  }
}
