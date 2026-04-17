import type { StudyResource } from "../../domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";

export interface ListStudyResourcesInput {
  readonly subjectId?: string;
  readonly userId?: string;
  readonly search?: string;
  readonly page: number;
  readonly pageSize: number;
}

export class ListStudyResources {
  constructor(private readonly repository: IStudyResourceRepository) {}

  async execute(input: ListStudyResourcesInput): Promise<StudyResource[]> {
    const page = Number.isInteger(input.page) && input.page >= 0 ? input.page : 0;
    const pageSize = Number.isInteger(input.pageSize)
      ? Math.min(50, Math.max(1, input.pageSize))
      : 10;

    return this.repository.list({
      subjectId: input.subjectId,
      userId: input.userId,
      search: input.search,
      page,
      pageSize,
    });
  }
}
