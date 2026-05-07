/**
 * ExpiradaState.ts
 * Estado: El grupo ha expirado por límite de tiempo
 * Transiciones válidas: NINGUNA (estado final)
 * NO válidas: todas las acciones lanzan error
 */

import type { IStudyGroupState } from "./IStudyGroupState.js";
import type { StudyGroupContext } from "./StudyGroupContext.js";

export class ExpiradaState implements IStudyGroupState {
  constructor(private readonly context: StudyGroupContext) {}

  requestAdminTransfer(groupId: string, actorUserId: string, targetUserId: string): void {
    throw new Error(
      `[ExpiradaState] No se pueden hacer cambios en un grupo expirado (${groupId})`,
    );
  }

  acceptAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[ExpiradaState] No se pueden hacer cambios en un grupo expirado (${groupId})`,
    );
  }

  rejectAdminTransfer(groupId: string, transferId: string): void {
    throw new Error(
      `[ExpiradaState] No se pueden hacer cambios en un grupo expirado (${groupId})`,
    );
  }

  closeGroup(groupId: string): void {
    throw new Error(
      `[ExpiradaState] No se puede cerrar un grupo ya expirado (${groupId})`,
    );
  }

  expireGroup(groupId: string): void {
    throw new Error(
      `[ExpiradaState] El grupo ya está expirado (${groupId})`,
    );
  }

  getStatusName(): string {
    return "expirada";
  }
}
