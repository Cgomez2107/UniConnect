import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class MarkMessageAsRead {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(messageId: string, actorUserId: string): Promise<boolean> {
    const normalizedMessageId = requireTrimmed(messageId, "messageId");
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");

    return this.repository.markMessageAsRead(normalizedMessageId, normalizedActorUserId);
  }
}
