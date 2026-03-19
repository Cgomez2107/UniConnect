import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class SendMessage {
  constructor(private readonly repository: IMessagingRepository) {}

  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  async execute(
    conversationId: string,
    senderId: string,
    content: string,
    media?: {
      mediaUrl?: string;
      mediaType?: string;
      mediaFilename?: string;
      replyToMessageId?: string;
      replyPreview?: string;
    },
  ): Promise<Message> {
    if (!conversationId.trim()) {
      throw new Error("conversationId es obligatorio.");
    }

    if (!senderId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    const normalizedContent = content.trim();
    const normalizedMediaUrl = media?.mediaUrl?.trim() ?? "";

    if (!normalizedContent && !normalizedMediaUrl) {
      throw new Error("Debes enviar texto o una imagen.");
    }

    if (normalizedContent.length > 5000) {
      throw new Error("content excede el maximo de 5000 caracteres.");
    }

    return this.repository.createMessage({
      conversationId: conversationId.trim(),
      senderId: senderId.trim(),
      content: normalizedContent,
      mediaUrl: normalizedMediaUrl || undefined,
      mediaType: media?.mediaType?.trim() || undefined,
      mediaFilename: media?.mediaFilename?.trim() || undefined,
      replyToMessageId:
        media?.replyToMessageId?.trim() && this.uuidRegex.test(media.replyToMessageId.trim())
          ? media.replyToMessageId.trim()
          : undefined,
      replyPreview: media?.replyPreview?.trim() || undefined,
    });
  }
}
