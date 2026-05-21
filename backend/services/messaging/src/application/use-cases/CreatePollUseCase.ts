import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { CreatePollConfigInput } from "../../interfaces/http/dto/PollDTOs.js";
import { BaseMessage } from "../../domain/decorators/BaseMessage.js";
import { PollMessageDecorator, type PollConfigData } from "../../domain/decorators/PollMessageDecorator.js";

export class CreatePollUseCase {
  constructor(
    private readonly repository: IMessagingRepository,
  ) {}

  async execute(input: CreatePollConfigInput): Promise<Record<string, unknown>> {
    const pollConfig = await this.repository.createPollConfig(input);

    const baseMessage = new BaseMessage({
      id: pollConfig.messageId,
      content: pollConfig.question,
      timestamp: new Date(pollConfig.createdAt),
      senderId: pollConfig.createdBy,
    });

    const pollData: PollConfigData = {
      pollId: pollConfig.pollId,
      question: pollConfig.question,
      options: [...pollConfig.options],
      expiresAt: pollConfig.expiresAt,
      status: pollConfig.status,
    };

    const decorated = new PollMessageDecorator(baseMessage, pollData);

    return decorated.toJSON();
  }
}
