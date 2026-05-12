import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

export class ListMyApplications {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(applicantId: string): Promise<Application[]> {
    if (!applicantId.trim()) {
      throw new Error("Applicant ID is required");
    }

    return this.repository.getByApplicantId(applicantId);
  }
}
