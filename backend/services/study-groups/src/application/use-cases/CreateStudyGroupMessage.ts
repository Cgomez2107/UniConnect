import type { StudyGroupMessage } from "../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../domain/repositories/IStudyGroupMessageRepository.js";
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

export interface CreateStudyGroupMessageInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly content: string;
}

export class CreateStudyGroupMessage {
  constructor(
    private readonly repository: IStudyGroupMessageRepository,
    private readonly subject: ChatSubject,
    private readonly realtimeObserver: IChatObserver,
    private readonly idempotencyObserver: IChatObserver,
  ) {}

  async execute(input: CreateStudyGroupMessageInput): Promise<StudyGroupMessage> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const content = requireTrimmed(input.content, "content");

    const created = await this.repository.create({
      requestId,
      actorUserId: input.actorUserId,
      content,
    });

    const channel = createGroupChannel(requestId);
    this.subject.subscribe(channel, this.idempotencyObserver);
    this.subject.subscribe(channel, this.realtimeObserver);

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

    this.subject.emit(channel, event).catch((error) => {
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
