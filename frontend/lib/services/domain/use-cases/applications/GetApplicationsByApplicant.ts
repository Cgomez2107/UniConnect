import type { Application } from "@/types"
import type { IApplicationRepository } from "../../repositories/IApplicationRepository"

export class GetApplicationsByApplicant {
  constructor(private repository: IApplicationRepository) {}

  async execute(applicantId: string): Promise<Application[]> {
    return this.repository.getByApplicant(applicantId)
  }
}
