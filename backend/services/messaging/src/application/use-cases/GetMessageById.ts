import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class GetMessageById {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(messageId: string, actorUserId: string): Promise<Message | null> {
    const normalizedMessageId = requireTrimmed(messageId, "messageId");
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");

    return this.repository.getMessageById(normalizedMessageId, normalizedActorUserId);
  }
}
