import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class AbiertaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(memberId: string): void {
    // TODO: Implementar lógica
  }

  reviewApplication(applicationId: string, status: string): void {
    // TODO: Implementar lógica
  }

  requestAdminTransfer(targetUserId: string): void {
    // TODO: Implementar lógica
  }

  acceptAdminTransfer(transferId: string): void {
    // TODO: Implementar lógica
  }

  leaveAdminRole(): void {
    // TODO: Implementar lógica
  }
}
