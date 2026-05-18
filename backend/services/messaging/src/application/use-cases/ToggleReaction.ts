import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { ChatSubject, IChatObserver, ReactionUpdatedEvent } from "../../domain/events/index.js";
import { createDMChannel } from "../../domain/events/index.js";

export class ToggleReaction {
  constructor(
    private readonly repository: IMessagingRepository,
    private readonly subject: ChatSubject,
    private readonly realtimeObserver: IChatObserver,
  ) {}

  async execute(messageId: string, userId: string, emoji: string): Promise<{ conversationId: string; reactions: import("../../domain/entities/Message.js").Reaction[] }> {
    const result = await this.repository.toggleReaction(messageId, userId, emoji);

    const conversation = await this.repository.getConversationById(result.conversationId, userId);
    if (conversation) {
      const channel = createDMChannel(conversation.participantA, conversation.participantB);
      this.subject.subscribe(channel, this.realtimeObserver);

      const event: ReactionUpdatedEvent = {
        type: "ReactionUpdated",
        version: "1.0",
        timestamp: new Date(),
        messageId,
        conversationId: result.conversationId,
        reactions: result.reactions,
      };

      this.subject.emit(channel, event).catch((error) => {
        console.error("[ToggleReaction] Error emitiendo evento:", error);
      });
    }

    return result;
  }
}