import { Pool } from "pg";

import type { MessagingEnv } from "../../config/env.js";
import type {
  ConversationSummary,
  CreateConversationInput,
} from "../../domain/entities/Conversation.js";
import type { CreateMessageInput, Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

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
  sender_full_name: string | null;
  sender_avatar_url: string | null;
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

function buildPool(env: MessagingEnv): Pool {
  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error("Variables de base de datos incompletas para PostgresMessagingRepository.");
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
    sender: {
      fullName: row.sender_full_name ?? "Usuario",
      avatarUrl: row.sender_avatar_url,
    },
  };
}

export class PostgresMessagingRepository implements IMessagingRepository {
  private readonly pool: Pool;

  constructor(env: MessagingEnv) {
    this.pool = buildPool(env);
  }

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
          p.full_name AS sender_full_name,
          p.avatar_url AS sender_avatar_url
        FROM messages m
        LEFT JOIN profiles p ON p.id = m.sender_id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
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
            reply_preview
          )
          VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''))
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
}
