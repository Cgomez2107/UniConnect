import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

export class ApplyToStudyRequest {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    const message = input.message.trim();

    if (!input.requestId.trim()) {
      throw new Error("Request id is required");
    }

    if (!input.applicantId.trim()) {
      throw new Error("Applicant id is required");
    }

    if (message.length === 0) {
      throw new Error("Application message is required");
    }

    return this.repository.create({
      requestId: input.requestId.trim(),
      applicantId: input.applicantId.trim(),
      message,
    });
  }
}