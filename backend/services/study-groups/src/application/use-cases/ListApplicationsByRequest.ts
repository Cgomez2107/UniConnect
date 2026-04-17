import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class ListApplicationsByRequest {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(input: { requestId: string; actorUserId: string }): Promise<Application[]> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    return this.repository.getByRequest(requestId, actorUserId);
  }
}