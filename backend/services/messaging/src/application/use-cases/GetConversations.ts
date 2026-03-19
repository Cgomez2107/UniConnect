import type { ConversationSummary } from "../../domain/entities/Conversation.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class GetConversations {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(userId: string): Promise<ConversationSummary[]> {
    if (!userId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    return this.repository.listConversationsByUser(userId);
  }
}
