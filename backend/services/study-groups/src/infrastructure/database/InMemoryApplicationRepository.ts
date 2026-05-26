import { ConflictError } from "../../../../../shared/libs/errors/ConflictError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";

export class InMemoryApplicationRepository implements IApplicationRepository {
  private readonly applications: Application[] = [];

  async getByRequest(requestId: string, _actorUserId: string): Promise<Application[]> {
    return this.applications.filter((application) => application.requestId === requestId);
  }

  async getById(applicationId: string): Promise<Application | null> {
    return this.applications.find((application) => application.id === applicationId) ?? null;
  }

  async create(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    const existing = this.applications.find(
      (a) => a.requestId === input.requestId && a.applicantId === input.applicantId
    );
    if (existing && existing.status !== "rechazada") {
      throw new ConflictError("Ya te postulaste a esta solicitud.");
    }
    if (existing && existing.status === "rechazada") {
      const updated: Application = {
        ...existing,
        message: input.message,
        status: "pendiente",
        reviewedAt: null,
        createdAt: new Date().toISOString(),
      };
      const idx = this.applications.findIndex((a) => a.id === existing.id);
      this.applications[idx] = updated;
      return updated;
    }

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

  async getByApplicantId(applicantId: string): Promise<Application[]> {
    return this.applications.filter((app) => app.applicantId === applicantId);
  }

  async delete(applicationId: string, actorUserId: string): Promise<void> {
    const idx = this.applications.findIndex((a) => a.id === applicationId);
    if (idx === -1) {
      throw new NotFoundError("Postulación no encontrada.");
    }
    const app = this.applications[idx];
    if (app.applicantId !== actorUserId) {
      throw new AuthorizationError("No puedes cancelar una postulación que no te pertenece.");
    }
    if (app.status !== "pendiente") {
      throw new ValidationError("Solo puedes cancelar postulaciones en estado pendiente.");
    }
    this.applications.splice(idx, 1);
  }
}