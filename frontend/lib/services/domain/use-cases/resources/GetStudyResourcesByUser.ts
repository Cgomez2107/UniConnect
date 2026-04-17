import type { StudyResource } from "@/types"
import type { IStudyResourceRepository } from "../../repositories/IStudyResourceRepository"

export class GetStudyResourcesByUser {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(userId: string): Promise<StudyResource[]> {
    return this.repository.getByUser(userId)
  }
}
