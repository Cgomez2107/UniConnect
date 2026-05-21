import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { PollResultsDTO } from "../../interfaces/http/dto/PollDTOs.js";

export class GetPollResultsUseCase {
  constructor(
    private readonly repository: IMessagingRepository,
  ) {}

  async execute(pollId: string): Promise<PollResultsDTO> {
    return this.repository.getPollResults(pollId);
  }
}
