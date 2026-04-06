import type { ConversationSummary } from "../../domain/entities/Conversation.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class GetOrCreateConversation {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(actorUserId: string, participantB: string): Promise<ConversationSummary> {
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");
    const normalizedParticipantB = requireTrimmed(participantB, "participantB");

    if (normalizedActorUserId === normalizedParticipantB) {
      throw new Error("No puedes iniciar una conversación contigo mismo.");
    }

    return this.repository.getOrCreateConversation({
      participantA: normalizedActorUserId,
      participantB: normalizedParticipantB,
      currentUserId: normalizedActorUserId,
    });
  }
}
