import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { ChatSubject, PollVoteRegisteredEvent } from "../../domain/events/index.js";
import { createGroupChannel } from "../../domain/events/index.js";
import type { VoteResultDTO } from "../../interfaces/http/dto/PollDTOs.js";

export class CastVoteUseCase {
  constructor(
    private readonly repository: IMessagingRepository,
    private readonly subject: ChatSubject,
  ) {}

  async execute(
    pollId: string,
    userId: string,
    selectedOption: number,
  ): Promise<VoteResultDTO> {
    const result = await this.repository.castVote(pollId, userId, selectedOption);

    const groupId = await this.repository.getPollGroupId(pollId);
    const channel = createGroupChannel(groupId);

    const event: PollVoteRegisteredEvent = {
      type: "POLL_VOTE_REGISTERED",
      version: "1.0",
      timestamp: new Date(),
      pollId,
      groupId,
      userId,
      selectedOption,
      results: result.results,
      totalVotes: result.totalVotes,
    };

    this.subject.emit(channel, event).catch((error) => {
      console.error("[CastVote] Error emitiendo evento:", error);
    });

    return result;
  }
}
