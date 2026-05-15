import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
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

  applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void {
    // Delegamos a la lógica del estado anterior (Abierta o Llena)
    this.previousState.setContext(this.context);
    this.previousState.applyToGroup(applicationId, applicantId, applicantName, message, adminUserId);
  }

  reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void {
    // Delegamos a la lógica del estado anterior
    this.previousState.setContext(this.context);
    this.previousState.reviewApplication(applicationId, status, reviewerId, applicantId, applicantName);
  }

  async requestAdminTransfer(_transferId: string, _actorUserId: string, _targetUserId: string, _currentState: string): Promise<void> {
    throw new InvalidStateTransitionError("TransferenciaPendiente", "requestAdminTransfer", "Ya existe una transferencia de administrador pendiente para este grupo.");
  }

  async acceptAdminTransfer(transferId: string, actorUserId: string, fromUserId: string, toUserId: string, previousState: string): Promise<void> {
    // Transición: Volvemos al estado en el que estábamos (Abierta o Llena)
    this.context.transitionTo(this.previousState);

    await this.context.emit({
      type: "TRANSFERENCIA_ADMIN_ACEPTADA",
      version: "1.0",
      timestamp: new Date(),
      transferId,
      groupId: this.context.requestId,
      oldAdminId: fromUserId,
      newAdminId: toUserId,
      newState: previousState,
      acceptedBy: actorUserId
    });
  }

  leaveAdminRole(_actorUserId: string): void {
    throw new InvalidStateTransitionError("TransferenciaPendiente", "leaveAdminRole", "No puedes salir del rol de administrador mientras haya una transferencia pendiente.");
  }
}
