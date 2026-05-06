import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class ExpiradaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(memberId: string): void {
    throw new Error("El grupo ha expirado.");
  }

  reviewApplication(applicationId: string, status: string): void {
    throw new Error("El grupo ha expirado.");
  }

  requestAdminTransfer(targetUserId: string): void {
    throw new Error("El grupo ha expirado.");
  }

  acceptAdminTransfer(transferId: string): void {
    throw new Error("El grupo ha expirado.");
  }

  leaveAdminRole(): void {
    throw new Error("El grupo ha expirado.");
  }
}
