import type { StudyGroupMessage } from "../../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";

export interface ListStudyGroupMessagesInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly page: number;
  readonly pageSize: number;
}

export class ListStudyGroupMessages {
  constructor(private readonly repository: IStudyGroupMessageRepository) {}

  async execute(input: ListStudyGroupMessagesInput): Promise<StudyGroupMessage[]> {
    return this.repository.listByRequest({
      requestId: input.requestId,
      actorUserId: input.actorUserId,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
