import type { StudyResource } from "@/types"
import type { IStudyResourceRepository } from "../../repositories/IStudyResourceRepository"

export class UpdateStudyResource {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(
    resourceId: string,
    userId: string,
    payload: { title?: string; description?: string | null }
  ): Promise<StudyResource> {
    return this.repository.update(resourceId, userId, payload)
  }
}
