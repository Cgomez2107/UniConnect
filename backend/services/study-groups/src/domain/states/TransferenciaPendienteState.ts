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
  constructor(private readonly context: StudyGroupContext) {}

  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void {
    throw new Error(
      `[TransferenciaPendienteState] Ya existe una transferencia pendiente en grupo ${groupId}. Debe ser aceptada o rechazada primero.`,
    );
  }

  acceptAdminTransfer(groupId: string, transferId: string): void {
    console.log(
      `[TransferenciaPendienteState] Aceptando transferencia ${transferId} en grupo ${groupId}`,
    );
    // Por ahora solo registra la acción. La lógica se implementará en Tarea 2.
  }

  rejectAdminTransfer(groupId: string, transferId: string): void {
    console.log(
      `[TransferenciaPendienteState] Rechazando transferencia ${transferId} en grupo ${groupId}`,
    );
    // Por ahora solo registra la acción.
  }

  closeGroup(groupId: string): void {
    console.log(`[TransferenciaPendienteState] Cerrando grupo ${groupId}`);
    // Por ahora solo registra la acción.
  }

  expireGroup(groupId: string): void {
    console.log(`[TransferenciaPendienteState] Expirando grupo ${groupId}`);
    // Por ahora solo registra la acción.
  }

  getStatusName(): string {
    return "transferenciaPendiente";
  }
}
