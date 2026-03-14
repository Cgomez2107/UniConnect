import { supabase } from "@/lib/supabase"
import { apiGet, apiPatch, apiPost } from "@/lib/api/client"
import type { IMessageRepository } from "../../domain/repositories/IMessageRepository"
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

  async create(conversationId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
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
