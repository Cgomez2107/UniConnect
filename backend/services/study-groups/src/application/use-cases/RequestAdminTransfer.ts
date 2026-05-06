import type { AdminTransfer } from "../../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface RequestAdminTransferInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly targetUserId: string;
}

/**
 * Caso de Uso: Solicitar transferencia de administración de un grupo de estudio.
 *
 * Delega la validación de reglas de negocio al dominio (patrón State):
 * - AbiertaState / LlenaState: permiten la transferencia → transición a TransferenciaPendienteState
 * - TransferenciaPendienteState: lanza DomainError (ya existe una pendiente)
 * - CerradaState / ExpiradaState: lanzan DomainError
 *
 * Orden de operaciones:
 * 1. Validar estado vía dominio (pre-persist guard)
 * 2. Persistir en BD y obtener el transferId real generado por la BD
 * 3. El dominio emite el evento con el ID real
 */
export class RequestAdminTransfer {
  constructor(
    private readonly repository: IAdminTransferRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: RequestAdminTransferInput): Promise<AdminTransfer> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const targetUserId = requireTrimmed(input.targetUserId, "targetUserId");

    // 1. Cargar el contexto StudyGroup (hidratado con el estado correcto)
    //    Si hay una transferencia pendiente → estado será TransferenciaPendienteState
    //    → requestAdminTransfer lanzará DomainError antes de persistir
    const group = await this.studyGroupRepository.loadStudyGroup(requestId, this.subject);

    // 2. Validación de dominio: el estado determina si la acción es válida.
    //    Usamos un transferId temporal para la validación. El evento real
    //    se emitirá en el paso 4 con el ID persistido.
    //    Si no es válido → DomainError propagado al controlador → HTTP 422
    const tempTransferId = crypto.randomUUID();
    group.requestAdminTransfer(tempTransferId, input.actorUserId, targetUserId);

    // 3. Persistir la transferencia en BD (obtiene el ID real de la BD)
    const created = await this.repository.requestTransfer({
      requestId,
      actorUserId: input.actorUserId,
      targetUserId,
    });

    // 4. Si el ID de BD difiere del temporal, emitir evento corregido
    if (created.id !== tempTransferId) {
      this.subject.emit({
        type: "TRANSFERENCIA_ADMIN_SOLICITADA",
        version: "1.0",
        timestamp: new Date(),
        transferId: created.id,
        requestId: created.requestId,
        actorUserId: input.actorUserId,
        targetUserId: created.toUserId,
        groupName: "",  // el nombre se obtiene de la notificación del step 2
      }).catch((error) => {
        console.error("[RequestAdminTransfer] Error emitiendo evento corregido:", error);
      });
    }

    return created;
  }
}
