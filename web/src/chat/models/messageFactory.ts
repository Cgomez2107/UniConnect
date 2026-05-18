import { BaseMessage } from "./BaseMessage.js";
import { FileDecorator } from "./FileDecorator.js";
import { MentionDecorator } from "./MentionDecorator.js";
import { ReactionDecorator } from "./ReactionDecorator.js";
import type { IMessage, FileData, MentionData, ReactionData } from "./IMessage.js";

interface RawMessageData {
  id: string;
  content: string;
  senderId: string;
  createdAt: string | Date;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaFilename?: string | null;
  mentions?: MentionData[];
  reactions?: any[];
}

function normalizeReactions(reactions: any[]): ReactionData[] {
  if (!reactions || reactions.length === 0) return [];
  if ("users" in reactions[0]) return reactions as ReactionData[];
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const userId = r.userId ?? r.user_id;
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    if (userId && !map.get(r.emoji)!.includes(userId)) {
      map.get(r.emoji)!.push(userId);
    }
  }
  return Array.from(map.entries()).map(([emoji, users]) => ({
    emoji,
    count: users.length,
    users,
  }));
}

export function buildDecoratedMessage(raw: RawMessageData): IMessage {
  const timestamp =
    typeof raw.createdAt === "string" ? new Date(raw.createdAt) : raw.createdAt;

  const base = new BaseMessage(raw.id, raw.content, raw.senderId, timestamp);
  let decorated: IMessage = base;

  if (raw.mediaUrl && raw.mediaType && raw.mediaFilename) {
    decorated = new FileDecorator(decorated, {
      url: raw.mediaUrl,
      mimeType: raw.mediaType,
      filename: raw.mediaFilename,
      size: 0,
    });
  }

  if (raw.mentions && raw.mentions.length > 0) {
    decorated = new MentionDecorator(decorated, raw.mentions);
  }

  const normalized = normalizeReactions(raw.reactions);
  if (normalized.length > 0) {
    decorated = new ReactionDecorator(decorated, normalized);
  }

  return decorated;
}
