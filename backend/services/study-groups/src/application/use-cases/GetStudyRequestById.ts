import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";

/**
 * Retrieves a study request detail while keeping validation in the application layer.
 */
export class GetStudyRequestById {
  constructor(private readonly repository: IStudyRequestRepository) {}

  async execute(id: string): Promise<StudyRequest | null> {
    const normalizedId = id.trim();
    if (normalizedId.length === 0) {
      throw new Error("Study request id is required");
    }

    return this.repository.getById(normalizedId);
  }
}