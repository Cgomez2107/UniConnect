import { fetchApi } from "@/lib/api/httpClient";
import type { Conversation } from "@/types";
import type { IConversationRepository } from "../../domain/repositories/IConversationRepository";

interface ApiConversation {
  id: string;
  participantA?: string;
  participant_a?: string;
  participantB?: string;
  participant_b?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  otherUserId?: string;
  other_user_id?: string;
  otherUserName?: string;
  other_user_name?: string;
  otherUserAvatar?: string | null;
  other_user_avatar?: string | null;
  lastMessage?: string | null;
  last_message?: string | null;
  lastMessageAt?: string | null;
  last_message_at?: string | null;
  unreadCount?: number;
  unread_count?: number;
}

function mapConversation(raw: ApiConversation): Conversation {
  return {
    id: raw.id,
    participant_a: raw.participantA ?? raw.participant_a ?? "",
    participant_b: raw.participantB ?? raw.participant_b ?? "",
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
    other_user_id: raw.otherUserId ?? raw.other_user_id ?? "",
    other_user_name: raw.otherUserName ?? raw.other_user_name ?? "Usuario",
    other_user_avatar: raw.otherUserAvatar ?? raw.other_user_avatar ?? null,
    last_message: raw.lastMessage ?? raw.last_message ?? null,
    last_message_at: raw.lastMessageAt ?? raw.last_message_at ?? null,
    unread_count: raw.unreadCount ?? raw.unread_count ?? 0,
  };
}

export class ApiConversationRepository implements IConversationRepository {
  async getById(id: string): Promise<Conversation | null> {
    try {
      const data = await fetchApi<ApiConversation>(`/conversations/${id}`);
      return data ? mapConversation(data) : null;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("no encontrada")) {
        return null;
      }
      throw error;
    }
  }

  async getByUser(_userId: string): Promise<Conversation[]> {
    const data = await fetchApi<ApiConversation[]>("/conversations");
    return (data ?? []).map(mapConversation);
  }

  async getOrCreate(participantA: string, participantB: string): Promise<Conversation> {
    void participantA;
    const data = await fetchApi<ApiConversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({
        participantB,
      }),
    });

    return mapConversation(data);
  }

  async updateLastActivity(id: string): Promise<void> {
    await fetchApi(`/conversations/${id}/touch`, {
      method: "PATCH",
    });
  }
}
