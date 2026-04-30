import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import type { MiembroAceptadoEvent, MiembroRechazadoEvent } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class ReviewApplication {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly studyRequestRepository: IStudyRequestRepository,
    private readonly subject: StudyGroupSubject,
  ) { }

  async execute(input: { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }): Promise<void> {
    const applicationId = requireTrimmed(input.applicationId, "applicationId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    const application = await this.repository.getById(applicationId);
    if (!application) {
      throw new Error("Postulacion no encontrada.");
    }

    const request = await this.studyRequestRepository.getById(application.requestId);
    if (!request) {
      throw new Error("Solicitud de estudio no encontrada.");
    }

    await this.repository.review({
      applicationId,
      actorUserId,
      status: input.status,
    });

    if (input.status === "aceptada") {
      // Obtenemos los miembros para encontrar el nombre del nuevo integrante
      const members = await this.memberRepository.listByRequest({ 
        requestId: application.requestId, 
        actorUserId 
      });
      const newMember = members.find(m => m.userId === application.applicantId);
      const applicantName = newMember?.fullName || "Nuevo integrante";

      const event: MiembroAceptadoEvent = {
        type: "MIEMBRO_ACEPTADO",
        version: "1.0",
        timestamp: new Date(),
        applicationId,
        requestId: application.requestId,
        applicantId: application.applicantId,
        applicantName,
        approvedBy: actorUserId,
        groupName: request.title,
      };

      this.subject.emit(event).catch((error) => {
        console.error("[ReviewApplication] Error emitiendo evento:", error);
      });
      return;
    }

    const event: MiembroRechazadoEvent = {
      type: "MIEMBRO_RECHAZADO",
      version: "1.0",
      timestamp: new Date(),
      applicationId,
      requestId: application.requestId,
      applicantId: application.applicantId,
      rejectedBy: actorUserId,
    };

    this.subject.emit(event).catch((error) => {
      console.error("[ReviewApplication] Error emitiendo evento:", error);
    });
  }
}
