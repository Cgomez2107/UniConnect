import { fetchApi } from "@/lib/api/httpClient";
import type { Message } from "@/types";
import type {
  CreateMessagePayload,
  IMessageRepository,
} from "../../domain/repositories/IMessageRepository";

interface ApiMessage {
  id: string;
  conversationId?: string;
  conversation_id?: string;
  senderId?: string;
  sender_id?: string;
  content: string;
  mediaUrl?: string | null;
  media_url?: string | null;
  mediaType?: string | null;
  media_type?: string | null;
  mediaFilename?: string | null;
  media_filename?: string | null;
  replyToMessageId?: string | null;
  reply_to_message_id?: string | null;
  replyPreview?: string | null;
  reply_preview?: string | null;
  createdAt?: string;
  created_at?: string;
  readAt?: string | null;
  read_at?: string | null;
  sender?: {
    fullName?: string;
    full_name?: string;
    avatarUrl?: string | null;
    avatar_url?: string | null;
  } | null;
}

function mapMessage(raw: ApiMessage): Message {
  return {
    id: raw.id,
    conversation_id: raw.conversationId ?? raw.conversation_id ?? "",
    sender_id: raw.senderId ?? raw.sender_id ?? "",
    content: raw.content,
    media_url: raw.mediaUrl ?? raw.media_url ?? null,
    media_type: raw.mediaType ?? raw.media_type ?? null,
    media_filename: raw.mediaFilename ?? raw.media_filename ?? null,
    reply_to_message_id: raw.replyToMessageId ?? raw.reply_to_message_id ?? null,
    reply_preview: raw.replyPreview ?? raw.reply_preview ?? null,
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    read_at: raw.readAt ?? raw.read_at ?? null,
    sender: raw.sender
      ? {
          full_name: raw.sender.fullName ?? raw.sender.full_name ?? "Usuario",
          avatar_url: raw.sender.avatarUrl ?? raw.sender.avatar_url ?? null,
        }
      : undefined,
  };
}

export class ApiMessageRepository implements IMessageRepository {
  async getById(id: string): Promise<Message | null> {
    try {
      const data = await fetchApi<ApiMessage>(`/messages/${id}`);
      return data ? mapMessage(data) : null;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("no encontrado")) {
        return null;
      }
      throw error;
    }
  }

  async getByConversation(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const params = new URLSearchParams({
      conversationId,
      limit: String(limit),
      offset: String(offset),
    });

    const data = await fetchApi<ApiMessage[]>(`/messages?${params.toString()}`);
    return (data ?? []).map(mapMessage);
  }

  async create(
    conversationId: string,
    senderId: string,
    payload: string | CreateMessagePayload,
  ): Promise<Message> {
    void senderId;

    const body =
      typeof payload === "string"
        ? {
            conversationId,
            content: payload,
          }
        : {
            conversationId,
            content: payload.content ?? "",
            mediaUrl: payload.media_url,
            mediaType: payload.media_type,
            mediaFilename: payload.media_filename,
            replyToMessageId: payload.reply_to_message_id,
            replyPreview: payload.reply_preview,
          };

    const data = await fetchApi<ApiMessage>("/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return mapMessage(data);
  }

  async markAsRead(messageId: string): Promise<void> {
    await fetchApi(`/messages/${messageId}/read`, {
      method: "PATCH",
    });
  }
}
