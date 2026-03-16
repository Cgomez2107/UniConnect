import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";

export interface ListOpenStudyRequestsInput {
  readonly subjectId?: string;
  readonly search?: string;
}

/**
 * Application use case that centralizes feed retrieval rules.
 * Additional business constraints should be added here first.
 */
export class ListOpenStudyRequests {
  constructor(private readonly repository: IStudyRequestRepository) {}

  async execute(input: ListOpenStudyRequestsInput = {}): Promise<StudyRequest[]> {
    return this.repository.listOpen({
      subjectId: input.subjectId,
      search: input.search?.trim(),
    });
  }
}
