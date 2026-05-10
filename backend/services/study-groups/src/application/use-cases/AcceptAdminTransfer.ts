import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface AcceptAdminTransferInput {
  readonly transferId: string;
  readonly actorUserId: string;
}

/**
 * Caso de Uso: Aceptar la transferencia de administración de un grupo de estudio.
 *
 * Delega la validación de reglas de negocio al dominio (patrón State):
 * - TransferenciaPendienteState: acepta → transición al estado anterior (Abierta/Llena)
 *                                y emite TRANSFERENCIA_ADMIN_ACEPTADA
 * - Cualquier otro estado:       lanza DomainError (422) — no hay transferencia pendiente
 *
 * El dominio centraliza tanto la validación como la emisión del evento.
 */
export class AcceptAdminTransfer {
  constructor(
    private readonly repository: IAdminTransferRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: AcceptAdminTransferInput): Promise<void> {
    const transferId = requireTrimmed(input.transferId, "transferId");

    // 1. Obtener la transferencia de la BD para conocer el requestId.
    //    Lanza NotFoundError (404) si no existe — error claro para el cliente.
    const transfer = await this.repository.getById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transferencia '${transferId}' no encontrada.`);
    }

    // 2. Cargar el contexto StudyGroup hidratado con el estado correcto.
    //    Si hay una transferencia pendiente en BD → estado será TransferenciaPendienteState
    //    → acceptAdminTransfer es válido y emitirá el evento.
    //    Si el grupo NO está en TransferenciaPendienteState → lanza DomainError (422).
    const group = await this.studyGroupRepository.loadStudyGroup(
      transfer.requestId,
      this.subject,
    );

    // Determinar el estado anterior (base) para el evento
    let previousState = "abierta"; // default
    if (group.membersCount >= group.maxMembers) {
      previousState = "llena";
    }

    // 3. El estado valida y emite el evento TRANSFERENCIA_ADMIN_ACEPTADA.
    //    Si el estado no permite la acción → InvalidStateTransitionError propagado al controlador → 422.
    await group.acceptAdminTransfer(
      transferId,
      input.actorUserId,
      transfer.fromUserId,
      transfer.toUserId,
      previousState,
    );

    // 4. Solo persistimos si el estado permitió la acción (no lanzó error).
    await this.repository.acceptTransfer({
      transferId,
      actorUserId: input.actorUserId,
    });
  }
}
