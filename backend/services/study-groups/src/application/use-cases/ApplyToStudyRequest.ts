import type { Application } from "../../domain/entities/Application.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

/**
 * Caso de Uso: Postularse a un grupo de estudio.
 *
 * Delega la validación de reglas de negocio al dominio (patrón State):
 * - AbiertaState:  permite la postulación y emite SOLICITUD_INGRESO
 * - LlenaState:    lanza DomainError (grupo lleno)
 * - CerradaState:  lanza DomainError (grupo cerrado)
 * - ExpiradaState: lanza DomainError (grupo expirado)
 */
export class ApplyToStudyRequest {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly studyRequestRepository: IStudyRequestRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
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

    // Obtenemos datos del grupo (incluyendo authorId para saber quién recibe la notificación)
    const request = await this.studyRequestRepository.getById(requestId);
    if (!request) {
      throw new Error("Solicitud de estudio no encontrada.");
    }

    // Cargamos el contexto StudyGroup con el estado correcto (hidratado desde BD)
    // El estado validará la regla de negocio y lanzará DomainError si no es válido
    const group = await this.studyGroupRepository.loadStudyGroup(requestId, this.subject);

    // El estado actual determina si la acción es válida y emite el evento de dominio
    group.applyToGroup(
      "",                              // applicationId no se usa en SOLICITUD_INGRESO
      applicantId,
      input.applicantName ?? "Un estudiante",
      message,
      request.authorId,               // adminUserId: destinatario de la notificación
    );

    // Solo persistimos si el estado permitió la acción (no lanzó DomainError)
    const created = await this.repository.create({ requestId, applicantId, message });

    return created;
  }
}