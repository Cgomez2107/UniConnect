import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class MarkConversationAsRead {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(conversationId: string, actorUserId: string): Promise<number> {
    const normalizedConversationId = requireTrimmed(conversationId, "conversationId");
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");

    return this.repository.markConversationAsRead(normalizedConversationId, normalizedActorUserId);
  }
}
