import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";

export interface ListSessionsInput {
  readonly groupId: string;
  readonly from?: string;
  readonly to?: string;
}

export class ListStudySessions {
  constructor(private readonly repository: IStudySessionRepository) {}

  async execute(input: ListSessionsInput): Promise<StudySession[]> {
    if (!input.groupId) throw new Error("Group ID is required");
    return this.repository.findByGroup(input.groupId, input.from, input.to);
  }
}
