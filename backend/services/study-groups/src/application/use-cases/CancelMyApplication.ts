import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class CancelMyApplication {
  constructor(private readonly applicationRepository: IApplicationRepository) {}

  async execute(applicationId: string, actorUserId: string): Promise<void> {
    const normalizedId = requireTrimmed(applicationId, "applicationId");
    const normalizedUserId = requireTrimmed(actorUserId, "actorUserId");
    await this.applicationRepository.delete(normalizedId, normalizedUserId);
  }
}
