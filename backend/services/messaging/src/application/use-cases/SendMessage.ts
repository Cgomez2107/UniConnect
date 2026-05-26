import type { Message, PollData } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type {
  ChatSubject,
  IChatObserver,
  NuevoMensajeEvent,
} from "../../domain/events/index.js";
import { createDMChannel } from "../../domain/events/index.js";
import {
  BaseMessage,
  FileDecorator,
  MentionDecorator,
  PollDecorator,
  extractMentionsFromContent,
  type FileMetadata,
} from "../../domain/decorators/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";
import { ValidatorFactory } from "../../../../../shared/patterns/chain/message/ValidatorFactory.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { PollTimerService } from "../../domain/services/PollTimerService.js";

export class SendMessage {
  private readonly validator = ValidatorFactory.createChain(5000);

  constructor(
    private readonly repository: IMessagingRepository,
    private readonly subject: ChatSubject,
    private readonly realtimeObserver: IChatObserver,
    private readonly idempotencyObserver: IChatObserver,
    private readonly chatNotificationObserver: IChatObserver,
    private readonly pollTimerService: PollTimerService,
    private readonly onClosePoll: (messageId: string) => Promise<void>,
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
      poll?: PollData;
    },
  ): Promise<Message> {
    const normalizedConversationId = requireTrimmed(conversationId, "conversationId");
    const normalizedSenderId = requireTrimmed(senderId, "senderId");

    const normalizedContent = content.trim();
    const normalizedMediaUrl = media?.mediaUrl?.trim() ?? "";

    const validationResult = await this.validator.manejar(normalizedContent, {
      mediaUrl: normalizedMediaUrl || undefined,
      mediaType: media?.mediaType?.trim() || undefined,
      mediaFilename: media?.mediaFilename?.trim() || undefined,
    });

    if (!validationResult.valido) {
      throw new Error(validationResult.mensajeError ?? "Error de validación");
    }

    const finalContent = validationResult.contenidoModificado ?? normalizedContent;

    const conversation = await this.repository.getConversationById(
      normalizedConversationId,
      normalizedSenderId,
    );

    if (!conversation) {
      throw new NotFoundError("Conversacion no encontrada.");
    }

    const poll = media?.poll;

    const created = await this.repository.createMessage({
      conversationId: normalizedConversationId,
      senderId: normalizedSenderId,
      content: finalContent,
      mediaUrl: normalizedMediaUrl || undefined,
      mediaType: media?.mediaType?.trim() || undefined,
      mediaFilename: media?.mediaFilename?.trim() || undefined,
      replyToMessageId:
        media?.replyToMessageId?.trim() && this.uuidRegex.test(media.replyToMessageId.trim())
          ? media.replyToMessageId.trim()
          : undefined,
      replyPreview: media?.replyPreview?.trim() || undefined,
      poll,
    });

    const channel = createDMChannel(conversation.participantA, conversation.participantB);
    this.subject.subscribe(channel, this.idempotencyObserver);
    this.subject.subscribe(channel, this.realtimeObserver);
    this.subject.subscribe(channel, this.chatNotificationObserver);

    const payload = buildDecoratedPayload(created, {
      mediaUrl: created.mediaUrl,
      mediaType: created.mediaType,
      mediaFilename: created.mediaFilename,
      content: created.content,
      poll: created.poll ?? undefined,
    });

    const event: NuevoMensajeEvent = {
      type: "NUEVO_MENSAJE",
      version: "1.0",
      timestamp: new Date(created.createdAt),
      messageId: created.id,
      conversationId: created.conversationId,
      senderId: created.senderId,
      senderName: created.sender?.fullName ?? "Usuario",
      content: created.content,
      conversationType: "dm",
      payload,
    };

    this.subject.emit(channel, event).catch((error) => {
      console.error("[SendMessage] Error emitiendo evento:", error);
    });

    if (poll?.closesAt) {
      this.pollTimerService.schedule(
        created.id,
        new Date(poll.closesAt),
        this.onClosePoll,
      );
    }

    return created;
  }
}

function buildDecoratedPayload(
  message: Message,
  input: {
    content: string;
    mediaUrl: string | null;
    mediaType: string | null;
    mediaFilename: string | null;
    poll?: PollData;
  },
): Record<string, unknown> {
  let decorated = new BaseMessage({
    id: message.id,
    content: input.content,
    timestamp: new Date(message.createdAt),
    senderId: message.senderId,
  });

  if (input.mediaUrl) {
    const file: FileMetadata = {
      filename: input.mediaFilename ?? "archivo",
      size: 1,
      mimeType: input.mediaType ?? "application/octet-stream",
      url: input.mediaUrl,
    };
    decorated = new FileDecorator(decorated, file);
  }

  const mentions = extractMentionsFromContent(input.content);
  if (mentions.length > 0) {
    decorated = new MentionDecorator(decorated, mentions);
  }

  if (input.poll) {
    decorated = new PollDecorator(decorated, {
      question: input.poll.question,
      options: input.poll.options.map((o) => ({
        text: o.text,
        votes: o.votes,
      })),
      isOpen: input.poll.isOpen,
      closesAt: input.poll.closesAt,
      createdAt: input.poll.createdAt,
    });
  }

  const payload = decorated.toJSON();

  if (message.replyToMessageId || message.replyPreview) {
    payload.reply = {
      replyToMessageId: message.replyToMessageId,
      replyPreview: message.replyPreview,
    };
  }

  return payload;
}
