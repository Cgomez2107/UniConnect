import type { StudyResource } from "../../domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository.js";

export class GetStudyResourceById {
  constructor(private readonly repository: IStudyResourceRepository) {}

  async execute(id: string): Promise<StudyResource | null> {
    if (!id.trim()) {
      return null;
    }

    return this.repository.getById(id);
  }
}
