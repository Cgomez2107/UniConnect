import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

export class InMemoryApplicationRepository implements IApplicationRepository {
  private readonly applications: Application[] = [];

  async getByRequest(requestId: string, _actorUserId: string): Promise<Application[]> {
    return this.applications.filter((application) => application.requestId === requestId);
  }

  async create(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    const created: Application = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      applicantId: input.applicantId,
      message: input.message,
      status: "pendiente",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };

    this.applications.unshift(created);
    return created;
  }

  async review(input: { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }): Promise<void> {
    const index = this.applications.findIndex((application) => application.id === input.applicationId);
    if (index === -1) {
      throw new Error("Application not found");
    }

    this.applications[index] = {
      ...this.applications[index],
      status: input.status,
      reviewedAt: new Date().toISOString(),
    };
  }
}