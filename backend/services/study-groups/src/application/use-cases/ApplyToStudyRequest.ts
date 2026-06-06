import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import type { IUserRepository } from "../../../../../shared/patterns/strategy/IUserRepository.js";
import { StudyGroupMembershipService } from "../../domain/services/StudyGroupMembershipService.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";
import { NotFoundError } from "../../../../../shared/libs/errors/index.js";

/**
 * Caso de Uso: Postularse a un grupo de estudio.
 *
 * Delega la emision de eventos al StudyGroupMembershipService,
 * separando la logica de membresia del patron State de transferencias.
 */
export class ApplyToStudyRequest {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly studyRequestRepository: IStudyRequestRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
    private readonly userRepository: IUserRepository,
    private readonly membershipService?: StudyGroupMembershipService,
  ) {}

  async execute(input: {
    requestId: string;
    applicantId: string;
    message: string;
    applicantName?: string;
  }): Promise<Application> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const applicantId = requireTrimmed(input.applicantId, "applicantId");
    const message = requireTrimmed(input.message, "message");

    const request = await this.studyRequestRepository.getById(requestId);
    if (!request) {
      throw new NotFoundError("Solicitud de estudio no encontrada.");
    }

    const group = await this.studyGroupRepository.loadStudyGroup(requestId, this.subject);

    let applicantName = input.applicantName;
    if (!applicantName || applicantName === "Un estudiante") {
      const fullName = await this.userRepository.getFullName(applicantId);
      applicantName = fullName ?? "Un estudiante";
    }

    const svc = this.membershipService ?? new StudyGroupMembershipService(this.subject);
    await svc.applyToGroup(
      group,
      applicantId,
      applicantName,
      message,
      request.authorId,
    );

    const created = await this.repository.create({ requestId, applicantId, message });

    return created;
  }
}