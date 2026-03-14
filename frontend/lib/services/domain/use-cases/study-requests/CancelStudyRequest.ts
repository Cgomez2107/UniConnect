import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class CancelStudyRequest {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string, userId: string): Promise<void> {
    await this.repository.cancel(requestId, userId)
  }
}
