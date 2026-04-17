import type { IApplicationRepository } from "../../repositories/IApplicationRepository"

export class GetMyApplicationStatus {
  constructor(private repository: IApplicationRepository) {}

  async execute(requestId: string, userId: string) {
    return this.repository.getMyApplicationStatus(requestId, userId)
  }
}
