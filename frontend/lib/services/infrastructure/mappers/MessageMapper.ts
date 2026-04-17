import type { Message } from "@/types"

export class MessageMapper {
  static toDomain(raw: any): Message {
    return {
      id: raw.id,
      conversation_id: raw.conversation_id,
      sender_id: raw.sender_id,
      content: raw.content,
      created_at: raw.created_at,
      read_at: raw.read_at,
      sender: raw.profiles ? { full_name: raw.profiles.full_name, avatar_url: raw.profiles.avatar_url } : undefined,
    } as Message
  }

  static toPersistence(domain: Message): Record<string, unknown> {
    return {
      id: domain.id,
      conversation_id: domain.conversation_id,
      sender_id: domain.sender_id,
      content: domain.content,
      read_at: domain.read_at,
    }
  }
}
