/**
 * TransferenciaPendienteState.ts
 * Estado: El grupo está en espera de aceptar/rechazar una transferencia de admin
 * Transiciones válidas:
 * - acceptAdminTransfer -> regresa a estado anterior (Abierta o Llena)
 * - rejectAdminTransfer -> regresa a estado anterior (Abierta o Llena)
 * - closeGroup -> CerradaState
 * - expireGroup -> ExpiradaState
 * NO válidas:
 * - requestAdminTransfer (ya hay una pendiente)
 */

import type { IStudyGroupState } from "./IStudyGroupState.js";
import type { StudyGroupContext } from "./StudyGroupContext.js";

export class TransferenciaPendienteState implements IStudyGroupState {
  // Mantiene track del estado anterior para poder volver en caso de rechazo
  private previousState: string = "abierta";

  constructor(private readonly context: StudyGroupContext, previousState: string = "abierta") {
    this.previousState = previousState;
  }

  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void {
    throw new Error(
      `[TransferenciaPendienteState] Ya existe una transferencia pendiente en grupo ${groupId}. Debe ser aceptada o rechazada primero.`,
    );
  }

  acceptAdminTransfer(groupId: string, transferId: string): void {
    console.log(
      `[TransferenciaPendienteState] Aceptando transferencia ${transferId} en grupo ${groupId}. Regresando a estado anterior.`,
    );
    // En la aceptación, el grupo regresa a su estado anterior (Abierta o Llena)
    // Por ahora simplemente regresa a "abierta" por defecto
    this.context.transitionTo(this.previousState);
  }

  rejectAdminTransfer(groupId: string, transferId: string): void {
    console.log(
      `[TransferenciaPendienteState] Rechazando transferencia ${transferId} en grupo ${groupId}. Regresando a estado anterior.`,
    );
    // En el rechazo, el grupo regresa a su estado anterior
    this.context.transitionTo(this.previousState);
  }

  closeGroup(groupId: string): void {
    console.log(`[TransferenciaPendienteState] Transicionando grupo ${groupId} a cerrada`);
    this.context.transitionTo("cerrada");
  }

  expireGroup(groupId: string): void {
    console.log(`[TransferenciaPendienteState] Transicionando grupo ${groupId} a expirada`);
    this.context.transitionTo("expirada");
  }

  getStatusName(): string {
    return "transferenciaPendiente";
  }
}
