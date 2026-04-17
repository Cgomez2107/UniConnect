import type { RequestAdminEntry, IStudyRequestRepository } from "../../repositories/IStudyRequestRepository"

export class GetStudyRequestAdmins {
  constructor(private repository: IStudyRequestRepository) {}

  async execute(requestId: string): Promise<RequestAdminEntry[]> {
    return this.repository.getAdmins(requestId)
  }
}
