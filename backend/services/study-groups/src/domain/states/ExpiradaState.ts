import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class ExpiradaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void {
    throw new Error("El grupo ha expirado.");
  }

  reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void {
    throw new Error("El grupo ha expirado.");
  }

  requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string): void {
    throw new Error("El grupo ha expirado.");
  }

  acceptAdminTransfer(transferId: string, actorUserId: string, fromUserId: string, toUserId: string): void {
    throw new Error("El grupo ha expirado.");
  }

  leaveAdminRole(actorUserId: string): void {
    throw new Error("El grupo ha expirado.");
  }
}
