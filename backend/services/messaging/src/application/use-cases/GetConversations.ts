import type { ConversationSummary } from "../../domain/entities/Conversation.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class GetConversations {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(userId: string): Promise<ConversationSummary[]> {
    const normalizedUserId = requireTrimmed(userId, "userId");

    return this.repository.listConversationsByUser(normalizedUserId);
  }
}
