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
      `[AbiertaState] Transicionando grupo ${groupId} a transferencia pendiente`,
    );
    this.context.transitionTo("transferenciaPendiente");
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
    console.log(`[AbiertaState] Transicionando grupo ${groupId} a cerrada`);
    this.context.transitionTo("cerrada");
  }

  expireGroup(groupId: string): void {
    console.log(`[AbiertaState] Transicionando grupo ${groupId} a expirada`);
    this.context.transitionTo("expirada");
  }

  getStatusName(): string {
    return "abierta";
  }
}
