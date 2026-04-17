import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class AssignStudyRequestAdmin {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string, targetUserId: string, actorUserId: string): Promise<void> {
    await this.repository.assignAdmin(requestId, targetUserId, actorUserId)
  }
}
