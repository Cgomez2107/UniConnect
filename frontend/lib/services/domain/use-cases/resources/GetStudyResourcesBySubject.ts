import type { IStudyResourceRepository } from "../../repositories/IStudyResourceRepository"
import type { StudyResource } from "@/types"

export class GetStudyResourcesBySubject {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(subjectId: string): Promise<StudyResource[]> {
    if (!subjectId || subjectId.trim().length === 0) {
      return this.repository.getAll()
    }
    return this.repository.getBySubject(subjectId)
  }
}
