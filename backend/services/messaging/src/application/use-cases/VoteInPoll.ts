import type { PollData } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { ChatSubject, IChatObserver, PollVoteEvent } from "../../domain/events/index.js";
import { createDMChannel } from "../../domain/events/index.js";

export class VoteInPoll {
  constructor(
    private readonly repository: IMessagingRepository,
    private readonly subject: ChatSubject,
    private readonly realtimeObserver: IChatObserver,
  ) {}

  async execute(
    messageId: string,
    userId: string,
    optionIndex: number,
  ): Promise<{ conversationId: string; poll: PollData }> {
    const result = await this.repository.voteInPoll(messageId, userId, optionIndex);

    const conversation = await this.repository.getConversationById(
      result.conversationId,
      userId,
    );

    if (conversation) {
      const channel = createDMChannel(
        conversation.participantA,
        conversation.participantB,
      );
      this.subject.subscribe(channel, this.realtimeObserver);

      const event: PollVoteEvent = {
        type: "PollVote",
        version: "1.0",
        timestamp: new Date(),
        messageId,
        conversationId: result.conversationId,
        optionIndex,
        userId,
        poll: result.poll,
      };

      this.subject.emit(channel, event).catch((error) => {
        console.error("[VoteInPoll] Error emitiendo evento:", error);
      });
    }

    return result;
  }
}
