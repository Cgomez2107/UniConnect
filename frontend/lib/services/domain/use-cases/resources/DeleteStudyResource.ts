import type { IStudyResourceRepository } from "../../repositories/IStudyResourceRepository"

export class DeleteStudyResource {
  constructor(private repository: IStudyResourceRepository) {}

  async execute(resourceId: string, userId: string): Promise<void> {
    if (!resourceId || resourceId.trim().length === 0) {
      throw new Error("Resource ID is required")
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required")
    }

    await this.repository.delete(resourceId, userId)
  }
}
