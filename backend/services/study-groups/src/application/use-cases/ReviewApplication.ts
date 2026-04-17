import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class ReviewApplication {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(input: { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }): Promise<void> {
    const applicationId = requireTrimmed(input.applicationId, "applicationId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    await this.repository.review({
      applicationId,
      actorUserId,
      status: input.status,
    });
  }
}