import type { StudyGroupMessage } from "../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../domain/repositories/IStudyGroupMessageRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface CreateStudyGroupMessageInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly content: string;
}

export class CreateStudyGroupMessage {
  constructor(private readonly repository: IStudyGroupMessageRepository) {}

  async execute(input: CreateStudyGroupMessageInput): Promise<StudyGroupMessage> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const content = requireTrimmed(input.content, "content");

    return this.repository.create({
      requestId,
      actorUserId: input.actorUserId,
      content,
    });
  }
}
