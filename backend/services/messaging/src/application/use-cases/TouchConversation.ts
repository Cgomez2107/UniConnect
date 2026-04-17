import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class TouchConversation {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(conversationId: string, actorUserId: string): Promise<void> {
    const normalizedConversationId = requireTrimmed(conversationId, "conversationId");
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");

    await this.repository.touchConversation(normalizedConversationId, normalizedActorUserId);
  }
}
