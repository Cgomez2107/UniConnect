import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { StudyGroupMembershipService } from "../../domain/services/StudyGroupMembershipService.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

/**
 * Caso de Uso: Revisar (aceptar/rechazar) una postulación a un grupo de estudio.
 *
 * Delega la emision de eventos al StudyGroupMembershipService,
 * separando la logica de membresia del patron State de transferencias.
 */
export class ReviewApplication {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly subject: StudyGroupSubject,
    private readonly membershipService?: StudyGroupMembershipService,
  ) {}

  async execute(input: {
    applicationId: string;
    actorUserId: string;
    status: "aceptada" | "rechazada";
  }): Promise<void> {
    const applicationId = requireTrimmed(input.applicationId, "applicationId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    const application = await this.repository.getById(applicationId);
    if (!application) {
      throw new Error("Postulacion no encontrada.");
    }

    const group = await this.studyGroupRepository.loadStudyGroup(
      application.requestId,
      this.subject,
    );

    let applicantName: string | undefined;
    if (input.status === "aceptada") {
      const members = await this.memberRepository.listByRequest({
        requestId: application.requestId,
        actorUserId,
      });
      const newMember = members.find((m) => m.userId === application.applicantId);
      applicantName = newMember?.fullName ?? "Nuevo integrante";
    }

    const svc = this.membershipService ?? new StudyGroupMembershipService(this.subject);
    const domainStatus = input.status === "aceptada" ? "approved" : "rejected";
    await svc.reviewApplication(
      group,
      applicationId,
      domainStatus,
      actorUserId,
      application.applicantId,
      applicantName,
    );

    await this.repository.review({
      applicationId,
      actorUserId,
      status: input.status,
    });
  }
}
