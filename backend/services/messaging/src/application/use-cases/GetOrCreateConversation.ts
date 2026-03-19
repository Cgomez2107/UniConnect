import type { ConversationSummary } from "../../domain/entities/Conversation.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class GetOrCreateConversation {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(actorUserId: string, participantB: string): Promise<ConversationSummary> {
    if (!actorUserId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    if (!participantB.trim()) {
      throw new Error("participantB es obligatorio.");
    }

    if (actorUserId === participantB) {
      throw new Error("No puedes iniciar una conversacion contigo mismo.");
    }

    return this.repository.getOrCreateConversation({
      participantA: actorUserId,
      participantB: participantB.trim(),
      currentUserId: actorUserId,
    });
  }
}
