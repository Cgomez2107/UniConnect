import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class CerradaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(memberId: string): void {
    throw new Error("El grupo está cerrado. No se aceptan más solicitudes.");
  }

  reviewApplication(applicationId: string, status: string): void {
    throw new Error("El grupo está cerrado. No se pueden revisar solicitudes.");
  }

  requestAdminTransfer(targetUserId: string): void {
    throw new Error("El grupo está cerrado. No se pueden realizar transferencias de administrador.");
  }

  acceptAdminTransfer(transferId: string): void {
    throw new Error("El grupo está cerrado. No se pueden aceptar transferencias.");
  }

  leaveAdminRole(): void {
    throw new Error("El grupo está cerrado. Operación no permitida.");
  }
}
