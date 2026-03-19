import type { ConversationSummary } from "../../domain/entities/Conversation.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class GetConversationById {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(conversationId: string, actorUserId: string): Promise<ConversationSummary | null> {
    if (!conversationId.trim()) {
      throw new Error("conversationId es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    return this.repository.getConversationById(conversationId, actorUserId);
  }
}
