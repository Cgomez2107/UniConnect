import type { Application, ApplicationStatus } from "../entities/Application.js";

export interface IApplicationRepository {
  getByRequest(requestId: string, actorUserId: string): Promise<Application[]>;
  getById(applicationId: string): Promise<Application | null>;
  create(input: { requestId: string; applicantId: string; message: string }): Promise<Application>;
  review(input: { applicationId: string; actorUserId: string; status: Exclude<ApplicationStatus, "pendiente"> }): Promise<void>;
}