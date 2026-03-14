import type { Conversation } from "@/types"

export class ConversationMapper {
  static toDomain(raw: any): Conversation {
    return {
      id: raw.id,
      participant_a: raw.participant_a,
      participant_b: raw.participant_b,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      other_user_id: raw.other_user_id,
      other_user_name: raw.other_user_name,
      other_user_avatar: raw.other_user_avatar,
      last_message: raw.last_message,
      last_message_at: raw.last_message_at,
      unread_count: raw.unread_count,
    } as Conversation
  }

  static toPersistence(domain: Conversation): Record<string, unknown> {
    return {
      id: domain.id,
      participant_a: domain.participant_a,
      participant_b: domain.participant_b,
      created_at: domain.created_at,
      updated_at: domain.updated_at,
    }
  }
}
