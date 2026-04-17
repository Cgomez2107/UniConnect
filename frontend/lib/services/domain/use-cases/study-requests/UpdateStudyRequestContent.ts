import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class UpdateStudyRequestContent {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(
    requestId: string,
    userId: string,
    payload: { title?: string; description?: string }
  ): Promise<void> {
    await this.repository.updateContent(requestId, userId, payload)
  }
}
