/**
 * LlenaState.ts
 * Estado: El grupo ha alcanzado el máximo de miembros
 * Transiciones válidas:
 * - requestAdminTransfer -> TransferenciaPendienteState
 * - closeGroup -> CerradaState
 * - expireGroup -> ExpiradaState
 * NO válidas:
 * - acceptAdminTransfer, rejectAdminTransfer sin transferencia pendiente
 */

import type { IStudyGroupState } from "./IStudyGroupState.js";
import type { StudyGroupContext } from "./StudyGroupContext.js";

export class LlenaState implements IStudyGroupState {
  constructor(private readonly context: StudyGroupContext) {}

  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void {
    console.log(
      `[LlenaState] Transicionando grupo lleno ${groupId} a transferencia pendiente`,
    );
    this.context.transitionTo("transferenciaPendiente");
  }

  acceptAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[LlenaState] No hay transferencia pendiente para aceptar en grupo ${groupId}`,
    );
  }

  rejectAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[LlenaState] No hay transferencia pendiente para rechazar en grupo ${groupId}`,
    );
  }

  closeGroup(groupId: string): void {
    console.log(`[LlenaState] Transicionando grupo lleno ${groupId} a cerrada`);
    this.context.transitionTo("cerrada");
  }

  expireGroup(groupId: string): void {
    console.log(`[LlenaState] Transicionando grupo lleno ${groupId} a expirada`);
    this.context.transitionTo("expirada");
  }

  getStatusName(): string {
    return "llena";
  }
}
