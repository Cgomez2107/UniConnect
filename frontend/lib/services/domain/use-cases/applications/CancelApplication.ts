import type { IApplicationRepository } from "../../repositories/IApplicationRepository"

export class CancelApplication {
  constructor(private repository: IApplicationRepository) {}

  async execute(requestId: string, userId: string): Promise<void> {
    await this.repository.cancel(requestId, userId)
  }
}
