import type { StudyResource } from "@/types"
import type { IStudyResourceRepository, ListResourcesFilters } from "../../repositories/IStudyResourceRepository"

export class ListStudyResources {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(filters?: ListResourcesFilters): Promise<StudyResource[]> {
    return this.repository.list(filters)
  }
}
