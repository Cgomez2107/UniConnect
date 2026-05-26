import type { Reaction } from "@/types"
import { 
  BaseMessage, 
  FileMessageDecorator, 
  MentionMessageDecorator, 
  ReactionMessageDecorator, 
  IMessage 
} from '@/chat/models/MessageDecorator';

function groupReactions(reactions: Reaction[]): { emoji: string; count: number }[] {
  const map = new Map<string, number>()
  for (const r of reactions) {
    map.set(r.emoji, (map.get(r.emoji) || 0) + 1)
  }
  return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }))
}

/**
 * Factory para transformar mensajes crudos en objetos decorados (US-D01).
 */
export function transformRawMessage(raw: any): IMessage {
  let message: IMessage = new BaseMessage(
    raw.id,
    raw.content || '',
    raw.sender_id || raw.senderId,
    new Date(raw.created_at || raw.createdAt),
  )

  const mediaUrl = raw.media_url || raw.mediaUrl
  if (mediaUrl) {
    message = new FileMessageDecorator(message, {
      url: mediaUrl,
      mimeType: raw.media_type || raw.mediaType || 'application/octet-stream',
      filename: raw.media_filename || raw.mediaFilename || 'archivo',
    })
  }

  if (Array.isArray(raw.mentions) && raw.mentions.length > 0) {
    message = new MentionMessageDecorator(message, raw.mentions)
  }

  if (Array.isArray(raw.reactions) && raw.reactions.length > 0) {
    const grouped = groupReactions(raw.reactions)
    message = new ReactionMessageDecorator(message, grouped)
  }

  return message
}
