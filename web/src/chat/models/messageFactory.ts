import { BaseMessage } from "./BaseMessage.js";
import { FileDecorator } from "./FileDecorator.js";
import { MentionDecorator } from "./MentionDecorator.js";
import type { IMessage, FileData, MentionData } from "./IMessage.js";

interface RawMessageData {
  id: string;
  content: string;
  senderId: string;
  createdAt: string | Date;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaFilename?: string | null;
  mentions?: MentionData[];
  reactions?: ReactionData[];
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

  return decorated;
}
