/**
 * CerradaState.ts
 * Estado: El grupo está cerrado y no acepta nuevas acciones
 * Transiciones válidas: NINGUNA (estado final)
 * NO válidas: todas las acciones lanzan error
 */

import type { IStudyGroupState } from "./IStudyGroupState.js";
import type { StudyGroupContext } from "./StudyGroupContext.js";

export class CerradaState implements IStudyGroupState {
  constructor(private readonly context: StudyGroupContext) {}

  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void {
    throw new Error(
      `[CerradaState] No se pueden hacer cambios en un grupo cerrado (${groupId})`,
    );
  }

  acceptAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[CerradaState] No se pueden hacer cambios en un grupo cerrado (${groupId})`,
    );
  }

  rejectAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[CerradaState] No se pueden hacer cambios en un grupo cerrado (${groupId})`,
    );
  }

  closeGroup(groupId: string): void {
    throw new Error(
      `[CerradaState] El grupo ya está cerrado (${groupId})`,
    );
  }

  expireGroup(groupId: string): void {
    throw new Error(
      `[CerradaState] No se puede expirar un grupo ya cerrado (${groupId})`,
    );
  }

  getStatusName(): string {
    return "cerrada";
  }
}
