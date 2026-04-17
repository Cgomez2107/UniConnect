import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

/**
 * Retrieves a study request detail while keeping validation in the application layer.
 */
export class GetStudyRequestById {
  constructor(private readonly repository: IStudyRequestRepository) {}

  async execute(id: string): Promise<StudyRequest | null> {
    const normalizedId = requireTrimmed(id, "studyRequestId");

    return this.repository.getById(normalizedId);
  }
}