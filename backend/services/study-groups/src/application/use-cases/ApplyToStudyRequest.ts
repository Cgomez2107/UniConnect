import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import type { SolicitudIngresoEvent } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class ApplyToStudyRequest {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly studyRequestRepository: IStudyRequestRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: { requestId: string; applicantId: string; message: string }): Promise<Application> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const applicantId = requireTrimmed(input.applicantId, "applicantId");
    const message = requireTrimmed(input.message, "message");

    const request = await this.studyRequestRepository.getById(requestId);
    if (!request) {
      throw new Error("Solicitud de estudio no encontrada.");
    }

    const created = await this.repository.create({
      requestId,
      applicantId,
      message,
    });

    const event: SolicitudIngresoEvent = {
      type: "SOLICITUD_INGRESO",
      version: "1.0",
      timestamp: new Date(),
      requestId,
      applicantId,
      recipientUserId: request.authorId,
      message,
    };

    this.subject.emit(event).catch((error) => {
      console.error("[ApplyToStudyRequest] Error emitiendo evento:", error);
    });

    return created;
  }
}