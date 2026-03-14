import type { StudyRequest } from "@/types"
import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class GetStudyRequestsByAuthor {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(authorId: string): Promise<StudyRequest[]> {
    return this.repository.getByAuthor(authorId)
  }
}
