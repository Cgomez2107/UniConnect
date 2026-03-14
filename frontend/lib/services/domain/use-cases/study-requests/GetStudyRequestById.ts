import type { StudyRequest } from "@/types"
import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class GetStudyRequestById {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string): Promise<StudyRequest | null> {
    return this.repository.getById(requestId)
  }
}
