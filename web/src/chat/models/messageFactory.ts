import { BaseMessage } from "./BaseMessage.js";
import { FileDecorator } from "./FileDecorator.js";
import { MentionDecorator } from "./MentionDecorator.js";
import type { IMessage, MentionData, ReactionData } from "./IMessage.js";

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

function deriveFilename(raw: RawMessageData): string {
  if (raw.mediaFilename) return raw.mediaFilename;
  const fromUrl = raw.mediaUrl?.split("/").pop()?.split("?")[0];
  if (fromUrl) return fromUrl;
  return raw.content || "archivo";
}

export function buildDecoratedMessage(raw: RawMessageData): IMessage {
  const timestamp =
    typeof raw.createdAt === "string" ? new Date(raw.createdAt) : raw.createdAt;

  const base = new BaseMessage(raw.id, raw.content, raw.senderId, timestamp);
  let decorated: IMessage = base;

  if (raw.mentions && raw.mentions.length > 0) {
    decorated = new MentionDecorator(decorated, raw.mentions);
  }

  if (raw.mediaUrl) {
    decorated = new FileDecorator(decorated, {
      url: raw.mediaUrl,
      mimeType: raw.mediaType || 'application/octet-stream',
      filename: deriveFilename(raw),
      size: 0,
    });
  }

  return decorated;
}
