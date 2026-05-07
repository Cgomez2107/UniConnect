/**
 * AbiertaState.ts
 * Estado: El grupo está abierto y aceptando miembros
 * Transiciones válidas:
 * - requestAdminTransfer -> TransferenciaPendienteState
 * - llena -> LlenaState (cuando se alcanza el máximo de miembros)
 * - closeGroup -> CerradaState
 * - expireGroup -> ExpiradaState
 */

import type { IStudyGroupState } from "./IStudyGroupState.js";
import type { StudyGroupContext } from "./StudyGroupContext.js";

export class AbiertaState implements IStudyGroupState {
  constructor(private readonly context: StudyGroupContext) {}

  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void {
    console.log(
      `[AbiertaState] Solicitando transferencia de admin en grupo ${groupId}`,
    );
    // Por ahora solo registra la acción. La lógica se implementará en Tarea 2.
  }

  acceptAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[AbiertaState] No hay transferencia pendiente para aceptar en grupo ${groupId}`,
    );
  }

  rejectAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[AbiertaState] No hay transferencia pendiente para rechazar en grupo ${groupId}`,
    );
  }

  closeGroup(groupId: string): void {
    console.log(`[AbiertaState] Cerrando grupo ${groupId}`);
    // Por ahora solo registra la acción.
  }

  expireGroup(groupId: string): void {
    console.log(`[AbiertaState] Expirando grupo ${groupId}`);
    // Por ahora solo registra la acción.
  }

  getStatusName(): string {
    return "abierta";
  }
}
