import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

export class ListApplicationsByRequest {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(input: { requestId: string; actorUserId: string }): Promise<Application[]> {
    if (!input.requestId.trim()) {
      throw new Error("Request id is required");
    }

    if (!input.actorUserId.trim()) {
      throw new Error("Actor user id is required");
    }

    return this.repository.getByRequest(input.requestId.trim(), input.actorUserId.trim());
  }
}