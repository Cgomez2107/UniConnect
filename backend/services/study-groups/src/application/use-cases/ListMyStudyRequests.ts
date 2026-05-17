import type { StudyRequest } from "../../domain/entities/StudyRequest.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";

export class ListMyStudyRequests {
  constructor(private readonly repository: IStudyRequestRepository) {}

  async execute(authorId: string): Promise<StudyRequest[]> {
    if (!authorId.trim()) {
      throw new Error("Author ID is required");
    }

    return this.repository.listByAuthorId(authorId);
  }
}
