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

  async markConversationAsRead(conversationId: string): Promise<number> {
    // Get current user ID for comparison
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    // Update all unread messages in the conversation where sender_id != currentUserId
    const { data, error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUser.id)
      .is("read_at", null)
      .select();

    if (error) throw error;

    // Return count of marked messages
    return (data ?? []).length;
  }

  async getTotalUnreadCount(): Promise<number> {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      return 0;
    }

    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_a.eq.${currentUser.id},participant_b.eq.${currentUser.id}`);

    if (convError) throw convError;

    const conversationIds = (conversations ?? []).map((c) => c.id);
    if (conversationIds.length === 0) {
      return 0;
    }

    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", currentUser.id)
      .is("read_at", null);

    if (error) throw error;
    return count ?? 0;
  }
}
