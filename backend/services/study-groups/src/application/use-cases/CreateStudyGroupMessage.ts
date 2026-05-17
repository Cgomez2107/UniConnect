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
  extractMentionsFromContent,
} from "../../../../messaging/src/domain/decorators/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";
import { ValidatorFactory, type IGroupPermissionRepository, type IAdminResolver } from "../../../../../shared/patterns/chain/message/index.js";

export interface CreateStudyGroupMessageInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly content: string;
  readonly mediaUrl?: string;
  readonly mediaType?: string;
  readonly mediaFilename?: string;
  readonly mentions?: any[];
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
  ) {
    this.validator = ValidatorFactory.createChain(5000, undefined, permissionRepo, adminResolver);
  }

  async execute(input: CreateStudyGroupMessageInput): Promise<StudyGroupMessage> {
    const requestId = requireTrimmed(input.requestId, "requestId");

    const content = input.content ?? "";

    await this.validator.validate(content, {
      mediaUrl: input.mediaUrl?.trim() || undefined,
      mediaType: input.mediaType?.trim() || undefined,
      mediaFilename: input.mediaFilename?.trim() || undefined,
      senderId: input.actorUserId,
      requestId,
      isGroup: true,
    });

    const finalMentions = (input.mentions && input.mentions.length > 0)
      ? input.mentions
      : extractMentionsFromContent(content);

    const created = await this.repository.create({
      requestId,
      actorUserId: input.actorUserId,
      content,
      mentions: finalMentions,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      mediaFilename: input.mediaFilename,
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

    return created;
  }
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

  return decorated.toJSON();
}
