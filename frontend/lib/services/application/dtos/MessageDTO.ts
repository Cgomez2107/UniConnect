/**
 * DTOs para Messaging (US-015/016)
 */
export interface SendMessageDTO {
  conversation_id: string
  content: string
}

export interface MessageResponseDTO {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
  sender_name?: string
  sender_avatar?: string | null
}

export interface ConversationResponseDTO {
  id: string
  participant_a: string
  participant_b: string
  created_at: string
  updated_at: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}
