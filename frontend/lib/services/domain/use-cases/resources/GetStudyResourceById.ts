import type { StudyResource } from "@/types"
import type { IStudyResourceRepository } from "../../repositories/IStudyResourceRepository"

export class GetStudyResourceById {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(resourceId: string): Promise<StudyResource | null> {
    return this.repository.getById(resourceId)
  }
}
