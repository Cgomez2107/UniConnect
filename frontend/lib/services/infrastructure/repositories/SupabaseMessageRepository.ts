import { supabase } from "@/lib/supabase"
import { apiGet, apiPatch, apiPost } from "@/lib/api/client"
import type {
  CreateMessagePayload,
  IMessageRepository,
} from "../../domain/repositories/IMessageRepository"
import type { Message } from "@/types"

/**
 * Supabase implementation of IMessageRepository.
 * Handles database operations for messages (US-015/016).
 */
export class SupabaseMessageRepository implements IMessageRepository {
  async getById(id: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles:sender_id ( full_name, avatar_url )")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data ?? null
  }

  async getByConversation(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    return apiGet<Message>("messages", (q) =>
      q
        .select("*, profiles:sender_id ( full_name, avatar_url )")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1)
    )
  }

  async create(
    conversationId: string,
    senderId: string,
    payload: string | CreateMessagePayload,
  ): Promise<Message> {
    const normalized =
      typeof payload === "string"
        ? { content: payload }
        : payload

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: normalized.content ?? "",
        media_url: normalized.media_url ?? null,
        media_type: normalized.media_type ?? null,
        media_filename: normalized.media_filename ?? null,
        reply_to_message_id: normalized.reply_to_message_id ?? null,
        reply_preview: normalized.reply_preview ?? null,
      })
      .select("*, profiles:sender_id ( full_name, avatar_url )")
      .single()

    if (error) throw error
    return data as Message
  }

  async markAsRead(messageId: string): Promise<void> {
    await apiPatch<Message>("messages", { read_at: new Date().toISOString() }, (q) => q.eq("id", messageId))
  }
}
