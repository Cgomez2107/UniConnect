import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class CerradaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void {
    throw new Error("El grupo está cerrado. No se aceptan más solicitudes.");
  }

  reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void {
    throw new Error("El grupo está cerrado. No se pueden revisar solicitudes.");
  }

  requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string): void {
    throw new Error("El grupo está cerrado. No se pueden realizar transferencias de administrador.");
  }

  acceptAdminTransfer(transferId: string, actorUserId: string, fromUserId: string, toUserId: string): void {
    throw new Error("El grupo está cerrado. No se pueden aceptar transferencias.");
  }

  leaveAdminRole(actorUserId: string): void {
    throw new Error("El grupo está cerrado. Operación no permitida.");
  }
}
