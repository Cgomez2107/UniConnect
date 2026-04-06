import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class ApplyToStudyRequest {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const applicantId = requireTrimmed(input.applicantId, "applicantId");
    const message = requireTrimmed(input.message, "message");

    return this.repository.create({
      requestId,
      applicantId,
      message,
    });
  }
}