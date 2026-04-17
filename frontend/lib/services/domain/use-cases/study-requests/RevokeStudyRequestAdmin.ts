import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class RevokeStudyRequestAdmin {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string, targetUserId: string, actorUserId: string): Promise<void> {
    await this.repository.revokeAdmin(requestId, targetUserId, actorUserId)
  }
}
