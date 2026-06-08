import type { StudyGroupMessage } from "../../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";
import type {
  ChatSubject,
  IChatObserver,
  NuevoMensajeEvent,
} from "../../../../messaging/src/domain/events/index.js";
import { createGroupChannel } from "../../../../messaging/src/domain/events/index.js";
import {
  BaseMessage,
  MentionDecorator,
  PollDecorator,
  extractMentionsFromContent,
} from "../../../../messaging/src/domain/decorators/index.js";
import { PollTimerService } from "../../../../messaging/src/domain/services/PollTimerService.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";
import { ValidatorFactory, type IGroupPermissionRepository, type IAdminResolver, type IModerationRepository } from "../../../../../shared/patterns/chain/message/index.js";
import { ModerationError } from "../../../../../shared/libs/errors/ModerationError.js";

export interface CreateStudyGroupMessageInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly content: string;
  readonly mediaUrl?: string;
  readonly mediaType?: string;
  readonly mediaFilename?: string;
  readonly mentions?: any[];
  readonly poll?: {
    readonly question: string;
    readonly options: readonly (string | { readonly text: string; readonly votes?: readonly string[] })[];
    readonly isOpen: boolean;
    readonly closesAt: string | null;
    readonly createdAt: string;
  };
}

export class CreateStudyGroupMessage {
  private readonly validator;

  constructor(
    private readonly repository: IStudyGroupMessageRepository,
    private readonly subject: ChatSubject,
    private readonly realtimeObserver: IChatObserver,
    private readonly idempotencyObserver: IChatObserver,
    private readonly chatNotificationObserver: IChatObserver | null,
    permissionRepo: IGroupPermissionRepository,
    adminResolver: IAdminResolver,
    moderationRepo: IModerationRepository,
    private readonly pollTimerService: PollTimerService,
    private readonly onClosePoll: (messageId: string) => Promise<void>,
  ) {
    this.validator = ValidatorFactory.createChain(1000, undefined, permissionRepo, adminResolver, moderationRepo);
  }

  async execute(input: CreateStudyGroupMessageInput): Promise<StudyGroupMessage> {
    const requestId = requireTrimmed(input.requestId, "requestId");

    const content = input.content ?? "";

    const validationResult = await this.validator.manejar(content, {
      mediaUrl: input.mediaUrl?.trim() || undefined,
      mediaType: input.mediaType?.trim() || undefined,
      mediaFilename: input.mediaFilename?.trim() || undefined,
      senderId: input.actorUserId,
      requestId,
      isGroup: true,
    });

    if (!validationResult.valido) {
      if (validationResult.codigoError && validationResult.codigoError.startsWith("MO_")) {
        console.warn(`[CreateStudyGroupMessage] Moderación falló (${validationResult.codigoError}), lanzando ModerationError:`, validationResult.mensajeError);
        throw new ModerationError(validationResult.mensajeError ?? "Moderación falló", validationResult.codigoError);
      }
      throw new Error(validationResult.mensajeError ?? "Error de validación");
    }

    const finalContent = validationResult.contenidoModificado ?? content;

    const finalMentions = (input.mentions && input.mentions.length > 0)
      ? input.mentions
      : extractMentionsFromContent(content);

    const created = await this.repository.create({
      requestId,
      actorUserId: input.actorUserId,
      content: finalContent,
      mentions: finalMentions,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      mediaFilename: input.mediaFilename,
      poll: input.poll ? {
        question: input.poll.question,
        options: input.poll.options.map(normalizePollOption),
        isOpen: input.poll.isOpen,
        closesAt: input.poll.closesAt,
        createdAt: input.poll.createdAt,
      } : undefined,
    });

    const channel = createGroupChannel(requestId);
    this.subject.subscribe(channel, this.idempotencyObserver);
    this.subject.subscribe(channel, this.realtimeObserver);

    if (this.chatNotificationObserver) {
      this.subject.subscribe(channel, this.chatNotificationObserver);
    }

    const payload = buildDecoratedPayload(created);

    const event: NuevoMensajeEvent = {
      type: "NUEVO_MENSAJE",
      version: "1.0",
      timestamp: new Date(created.createdAt),
      messageId: created.id,
      conversationId: requestId,
      senderId: created.senderId,
      senderName: created.senderFullName ?? "Usuario",
      content: created.content,
      conversationType: "group",
      payload,
    };

    this.subject.emit(channel, event).catch((error: any) => {
      console.error("[CreateStudyGroupMessage] Error emitiendo evento:", error);
    });

    if (input.poll?.closesAt) {
      this.pollTimerService.schedule(
        created.id,
        new Date(input.poll.closesAt),
        this.onClosePoll,
      );
    }

    return created;
  }
}

function normalizePollOption(o: string | { text: string; votes?: readonly string[] }): { text: string; votes: string[] } {
  if (typeof o === "string") {
    return { text: o, votes: [] };
  }
  return { text: o.text, votes: [...(o.votes ?? [])] };
}

function buildDecoratedPayload(message: StudyGroupMessage): Record<string, unknown> {
  let decorated = new BaseMessage({
    id: message.id,
    content: message.content,
    timestamp: new Date(message.createdAt),
    senderId: message.senderId,
  });

  const mentions = extractMentionsFromContent(message.content);
  if (mentions.length > 0) {
    decorated = new MentionDecorator(decorated, mentions);
  }

  if (message.poll) {
    decorated = new PollDecorator(decorated, {
      question: message.poll.question,
      options: message.poll.options.map((o) => normalizePollOption(o)),
      isOpen: message.poll.isOpen,
      closesAt: message.poll.closesAt,
      createdAt: message.poll.createdAt,
    });
  }

  return {
    ...decorated.toJSON(),
    ...(message.mediaUrl ? { media_url: message.mediaUrl, mediaUrl: message.mediaUrl } : {}),
    ...(message.mediaType ? { media_type: message.mediaType, mediaType: message.mediaType } : {}),
    ...(message.mediaFilename ? { media_filename: message.mediaFilename, mediaFilename: message.mediaFilename } : {}),
  };
}
