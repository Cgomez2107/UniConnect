import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class TransferenciaPendienteState implements IStudyGroupState {
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
    throw new Error("Ya existe una transferencia de administrador pendiente.");
  }

  acceptAdminTransfer(transferId: string): void {
    // TODO: Implementar lógica
  }

  leaveAdminRole(): void {
    throw new Error("No puedes salir del rol de administrador mientras haya una transferencia pendiente.");
  }
}
