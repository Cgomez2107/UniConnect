import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { ChatSubject, NewMessageEvent } from "../../domain/events/index.js";
import { createGroupChannel, createDmChannel } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";
import { BaseMessage, FileDecorator, MentionDecorator } from "../../domain/decorators/index.js";
import type { FileMetadata, Mention } from "../../domain/decorators/index.js";

export class SendMessage {
  constructor(
    private readonly repository: IMessagingRepository,
    private readonly chatSubject: ChatSubject,
  ) {}

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
    mentions?: Mention[],
  ): Promise<Message> {
    const normalizedConversationId = requireTrimmed(conversationId, "conversationId");
    const normalizedSenderId = requireTrimmed(senderId, "senderId");

    const normalizedContent = content.trim();
    const normalizedMediaUrl = media?.mediaUrl?.trim() ?? "";

    if (!normalizedContent && !normalizedMediaUrl) {
      throw new Error("Debes enviar texto o una imagen.");
    }

    if (normalizedContent.length > 5000) {
      throw new Error("content excede el máximo de 5000 caracteres.");
    }

    // 1️⃣ Crear el mensaje en BD
    const message = await this.repository.createMessage({
      conversationId: normalizedConversationId,
      senderId: normalizedSenderId,
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

    // 2️⃣ Construir versión decorada del mensaje para emitir
    // Aplicar decoradores en cadena: BaseMessage → FileDecorator → MentionDecorator
    let decoratedMessage = new BaseMessage({
      id: message.id,
      content: normalizedContent,
      timestamp: new Date(message.createdAt),
      senderId: normalizedSenderId,
    });

    // ✅ Agregar FileDecorator si hay media
    if (normalizedMediaUrl && media?.mediaType) {
      const fileMetadata: FileMetadata = {
        filename: media.mediaFilename || "archivo",
        size: 0, // En producción: obtener del S3 o donde se almacene
        mimeType: media.mediaType,
        url: normalizedMediaUrl,
      };
      decoratedMessage = new FileDecorator(decoratedMessage, fileMetadata);
    }

    // ✅ Agregar MentionDecorator si hay menciones
    if (mentions && mentions.length > 0) {
      decoratedMessage = new MentionDecorator(decoratedMessage, mentions);
    }

    // 3️⃣ Emitir evento de nuevo mensaje en el canal correspondiente
    // TODO: Determinar si es grupo o DM (aquí asumo grupo por ahora)
    const channel = createGroupChannel(normalizedConversationId);

    const event: NewMessageEvent = {
      type: "NewMessage",
      version: "1.0",
      timestamp: new Date(),
      messageId: message.id,
      conversationId: normalizedConversationId,
      senderId: normalizedSenderId,
      senderName: message.sender?.fullName ?? "Unknown",
      content: normalizedContent,
      conversationType: "group", // TODO: Traer del repositorio
      payload: decoratedMessage.toJSON(), // ✅ Payload decorado con file, mentions, reactions
    };

    // Emitir de forma asíncrona (no bloquea retorno)
    this.chatSubject.emit(channel, event).catch((error) => {
      console.error("[SendMessage] Error emitiendo evento:", error);
      // No relanzar error, el mensaje ya fue creado exitosamente
    });

    return message;
  }
}
