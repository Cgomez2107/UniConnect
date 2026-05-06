import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

/**
 * Caso de Uso: Revisar (aceptar/rechazar) una postulación a un grupo de estudio.
 *
 * Delega la validación de reglas de negocio al dominio (patrón State):
 * - AbiertaState:  acepta o rechaza. Si acepta y grupo queda lleno → transición a LlenaState
 * - LlenaState:    solo permite rechazar (aceptar lanza DomainError)
 * - CerradaState:  lanza DomainError (grupo cerrado)
 * - ExpiradaState: lanza DomainError (grupo expirado)
 *
 * El estado emite los eventos MIEMBRO_ACEPTADO o MIEMBRO_RECHAZADO según corresponda.
 */
export class ReviewApplication {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: {
    applicationId: string;
    actorUserId: string;
    status: "aceptada" | "rechazada";
  }): Promise<void> {
    const applicationId = requireTrimmed(input.applicationId, "applicationId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    // 1. Obtener la postulación para conocer el requestId y applicantId
    const application = await this.repository.getById(applicationId);
    if (!application) {
      throw new Error("Postulacion no encontrada.");
    }

    // 2. Cargar el contexto StudyGroup con el estado correcto (hidratado desde BD)
    const group = await this.studyGroupRepository.loadStudyGroup(
      application.requestId,
      this.subject,
    );

    // 3. Resolver el nombre del solicitante si la acción es aceptar
    let applicantName: string | undefined;
    if (input.status === "aceptada") {
      const members = await this.memberRepository.listByRequest({
        requestId: application.requestId,
        actorUserId,
      });
      const newMember = members.find((m) => m.userId === application.applicantId);
      applicantName = newMember?.fullName ?? "Nuevo integrante";
    }

    // 4. El estado valida la regla de negocio y emite el evento de dominio.
    //    Lanza DomainError si la acción no está permitida en el estado actual.
    const domainStatus = input.status === "aceptada" ? "approved" : "rejected";
    group.reviewApplication(
      applicationId,
      domainStatus,
      actorUserId,
      application.applicantId,
      applicantName,
    );

    // 5. Solo persistimos si el estado permitió la acción
    await this.repository.review({
      applicationId,
      actorUserId,
      status: input.status,
    });
  }
}
