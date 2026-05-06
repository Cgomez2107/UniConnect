import type { AdminTransfer } from "../../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface RequestAdminTransferInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly targetUserId: string;
}

/**
 * ISubject vacío que descarta todos los eventos.
 * Se usa para realizar la validación de estado del dominio sin efectos secundarios
 * (sin emitir notificaciones ni disparar observers).
 */
const noOpSubject: ISubject = {
  subscribe: () => {},
  unsubscribe: () => {},
  emit: async () => {},
};

/**
 * Caso de Uso: Solicitar transferencia de administración de un grupo de estudio.
 *
 * Delega la validación de reglas de negocio al dominio (patrón State):
 * - AbiertaState / LlenaState:           permiten la transferencia
 * - TransferenciaPendienteState:         lanza DomainError (ya existe una pendiente)
 * - CerradaState / ExpiradaState:        lanzan DomainError
 *
 * Flujo garantizando el ID correcto en la notificación:
 * 1. Valida estado vía dominio con noOpSubject → DomainError si no es válido (sin efectos)
 * 2. Persiste en BD → obtiene el transferId REAL generado por la BD
 * 3. Emite el evento de dominio con el ID real → frontend recibe el UUID correcto
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

    // 1. Cargar el StudyGroup con un subject NoOp (solo para validación de estado).
    //    Si el estado no permite la acción → lanza DomainError (422) antes de persistir.
    //    Si sí permite → no se emite ningún evento real todavía.
    const groupForValidation = await this.studyGroupRepository.loadStudyGroup(
      requestId,
      noOpSubject,
    );
    groupForValidation.requestAdminTransfer("__validation__", input.actorUserId, targetUserId);

    // 2. Persistir en BD → obtenemos el AdminTransfer con el transferId REAL de la BD.
    const created = await this.repository.requestTransfer({
      requestId,
      actorUserId: input.actorUserId,
      targetUserId,
    });

    // 3. Emitir el evento TRANSFERENCIA_ADMIN_SOLICITADA con el ID real de la BD.
    //    El frontend recibirá este UUID y lo usará para aceptar la transferencia.
    this.subject.emit({
      type: "TRANSFERENCIA_ADMIN_SOLICITADA",
      version: "1.0",
      timestamp: new Date(),
      transferId: created.id,                    // ← UUID real de la BD
      requestId: created.requestId,
      actorUserId: input.actorUserId,
      targetUserId: created.toUserId,
      groupName: groupForValidation.groupName,   // ← nombre del grupo del contexto
    }).catch((error) => {
      console.error("[RequestAdminTransfer] Error emitiendo evento:", error);
    });

    return created;
  }
}
