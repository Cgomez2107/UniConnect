import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class TransferenciaPendienteState implements IStudyGroupState {
  private context!: IStudyGroupContext;
  private previousState: IStudyGroupState;

  constructor(previousState: IStudyGroupState) {
    this.previousState = previousState;
  }

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(memberId: string): void {
    // Delegamos a la lógica del estado anterior (Abierta o Llena)
    this.previousState.applyToGroup(memberId);
  }

  reviewApplication(applicationId: string, status: string): void {
    // Delegamos a la lógica del estado anterior
    this.previousState.reviewApplication(applicationId, status);
  }

  requestAdminTransfer(targetUserId: string): void {
    throw new Error("Ya existe una transferencia de administrador pendiente.");
  }

  acceptAdminTransfer(transferId: string): void {
    // Transición: Volvemos al estado en el que estábamos (Abierta o Llena)
    this.context.transitionTo(this.previousState);
  }

  leaveAdminRole(): void {
    throw new Error("No puedes salir del rol de administrador mientras haya una transferencia pendiente.");
  }
}
