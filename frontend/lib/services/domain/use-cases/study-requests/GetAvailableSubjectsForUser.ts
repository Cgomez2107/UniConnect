import type { UserSubjectCatalogItem, IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class GetAvailableSubjectsForUser {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(userId: string): Promise<UserSubjectCatalogItem[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required")
    }

    return this.repository.getAvailableSubjectsForUser(userId)
  }
}
