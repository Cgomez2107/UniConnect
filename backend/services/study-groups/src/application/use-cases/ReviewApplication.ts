import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

export class ReviewApplication {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(input: { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }): Promise<void> {
    if (!input.applicationId.trim()) {
      throw new Error("Application id is required");
    }

    if (!input.actorUserId.trim()) {
      throw new Error("Actor user id is required");
    }

    await this.repository.review({
      applicationId: input.applicationId.trim(),
      actorUserId: input.actorUserId.trim(),
      status: input.status,
    });
  }
}