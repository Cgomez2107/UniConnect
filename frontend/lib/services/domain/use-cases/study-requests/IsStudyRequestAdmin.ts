import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class IsStudyRequestAdmin {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string, userId: string): Promise<boolean> {
    return this.repository.isAdmin(requestId, userId)
  }
}
