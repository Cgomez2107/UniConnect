import type { ConversationSummary } from "../../domain/entities/Conversation.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class GetConversationById {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(conversationId: string, actorUserId: string): Promise<ConversationSummary | null> {
    const normalizedConversationId = requireTrimmed(conversationId, "conversationId");
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");

    return this.repository.getConversationById(normalizedConversationId, normalizedActorUserId);
  }
}
