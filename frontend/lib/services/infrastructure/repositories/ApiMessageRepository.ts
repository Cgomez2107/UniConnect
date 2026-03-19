import { fetchApi } from "@/lib/api/httpClient";
import type { Message } from "@/types";
import type { IMessageRepository } from "../../domain/repositories/IMessageRepository";

interface ApiMessage {
  id: string;
  conversationId?: string;
  conversation_id?: string;
  senderId?: string;
  sender_id?: string;
  content: string;
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

  async create(conversationId: string, senderId: string, content: string): Promise<Message> {
    void senderId;

    const data = await fetchApi<ApiMessage>("/messages", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        content,
      }),
    });

    return mapMessage(data);
  }

  async markAsRead(messageId: string): Promise<void> {
    await fetchApi(`/messages/${messageId}/read`, {
      method: "PATCH",
    });
  }
}
