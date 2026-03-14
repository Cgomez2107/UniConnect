import type { StudentSearchResult } from "@/types"
import type { IStudentRepository } from "../../repositories/IStudentRepository"

export class SearchStudentsBySubject {
  constructor(private repository: IStudentRepository) {}

  async execute(
    subjectId: string,
    currentUserId: string,
    page = 0,
    pageSize = 20
  ): Promise<StudentSearchResult[]> {
    if (!subjectId || subjectId.trim().length === 0) {
      throw new Error("Subject ID is required")
    }

    if (!currentUserId || currentUserId.trim().length === 0) {
      throw new Error("User ID is required")
    }

    return this.repository.searchBySubject(subjectId, currentUserId, page, pageSize)
  }
}
