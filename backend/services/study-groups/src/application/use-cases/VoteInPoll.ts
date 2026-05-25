import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";
import type { ChatSubject, IChatObserver, PollVoteEvent } from "../../../../messaging/src/domain/events/index.js";
import { createGroupChannel } from "../../../../messaging/src/domain/events/index.js";

export class VoteInPoll {
  constructor(
    private readonly repository: IStudyGroupMessageRepository,
    private readonly subject: ChatSubject,
    private readonly realtimeObserver: IChatObserver,
  ) {}

  async execute(
    messageId: string,
    userId: string,
    optionIndex: number,
  ): Promise<{ requestId: string; poll: any }> {
    const result = await this.repository.voteInPoll(messageId, userId, optionIndex);

    const channel = createGroupChannel(result.requestId);
    this.subject.subscribe(channel, this.realtimeObserver);

    const event: PollVoteEvent = {
      type: "PollVote",
      version: "1.0",
      timestamp: new Date(),
      messageId,
      conversationId: result.requestId,
      optionIndex,
      userId,
      poll: result.poll,
    };

    this.subject.emit(channel, event).catch((error: any) => {
      console.error("[VoteInPoll] Error emitiendo evento:", error);
    });

    return result;
  }
}
