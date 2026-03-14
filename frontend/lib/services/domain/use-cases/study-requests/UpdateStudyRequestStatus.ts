import type { IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class UpdateStudyRequestStatus {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string, status: "abierta" | "cerrada" | "expirada"): Promise<void> {
    await this.repository.updateStatus(requestId, status)
  }
}
