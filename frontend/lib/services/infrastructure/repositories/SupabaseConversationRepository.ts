import { supabase } from "@/lib/supabase"
import { apiGet, apiPatch } from "@/lib/api/client"
import type { IConversationRepository } from "../../domain/repositories/IConversationRepository"
import type { Conversation } from "@/types"

/**
 * Supabase implementation of IConversationRepository.
 * Handles database operations for 1:1 conversations (US-015/016).
 */
export class SupabaseConversationRepository implements IConversationRepository {
  async getById(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return data ? this.enrichConversation(data, user?.id) : null
  }

  async getByUser(userId: string): Promise<Conversation[]> {
    const conversations = await apiGet<Conversation>("conversations", (q) =>
      q
        .select("*")
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order("updated_at", { ascending: false })
    )

    return Promise.all(conversations.map((c) => this.enrichConversation(c, userId)))
  }

  async getOrCreate(participantA: string, participantB: string): Promise<Conversation> {
    const normalized = [participantA, participantB].sort()
    const [pA, pB] = normalized as [string, string]

    const existing = await apiGet<Conversation>("conversations", (q) =>
      q
        .select("*")
        .eq("participant_a", pA)
        .eq("participant_b", pB)
        .single()
        .maybeSingle()
    )

    if (existing.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return this.enrichConversation(existing[0], user?.id)
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant_a: pA,
        participant_b: pB,
      })
      .select("*")
      .single()

    if (error) throw error
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return this.enrichConversation(data, user?.id)
  }

  async updateLastActivity(id: string): Promise<void> {
    await apiPatch<Conversation>("conversations", { updated_at: new Date().toISOString() }, (q) => q.eq("id", id))
  }

  private async enrichConversation(conversation: any, currentUserId?: string): Promise<Conversation> {
    const otherParticipantId =
      currentUserId && conversation.participant_a === currentUserId
        ? conversation.participant_b
        : conversation.participant_a
    const { data: otherUser } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", otherParticipantId).single()

    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let unreadQuery = supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversation.id)
      .is("read_at", null)

    if (currentUserId) {
      unreadQuery = unreadQuery.neq("sender_id", currentUserId)
    }

    const { count: unreadCount } = await unreadQuery

    return {
      ...conversation,
      other_user_id: otherParticipantId,
      other_user_name: otherUser?.full_name ?? "Usuario",
      other_user_avatar: otherUser?.avatar_url ?? null,
      last_message: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? null,
      unread_count: unreadCount ?? 0,
    } as Conversation
  }
}
