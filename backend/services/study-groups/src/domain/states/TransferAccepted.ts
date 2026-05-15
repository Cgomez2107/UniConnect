import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IState, IGroupContext } from "./IState.js";
import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import { Active } from "./Active.js";
import type { PendingTransfer } from "./PendingTransfer.js";

export class TransferAccepted implements IState {
  private context!: IGroupContext;

  constructor(private readonly parent: PendingTransfer) {}

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new InvalidStateTransitionError("TransferAccepted", "solicitar", "Transferencia en proceso de confirmación.");
  }

  async aceptar(): Promise<void> {
    throw new InvalidStateTransitionError("TransferAccepted", "aceptar", "Transferencia ya aceptada, esperando confirmación.");
  }

  async rechazar(): Promise<void> {
    return this.parent.rechazar();
  }

  async transferir(): Promise<void> {
    const previousAdminId = this.context.adminId;
    this.context.adminId = this.parent.targetUserId;
    this.context.transitionTo(new Active());

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_COMPLETED",
      version: "1.0",
      timestamp: new Date(),
      transferId: this.parent.transferId,
      groupId: this.context.requestId,
      oldAdminId: previousAdminId,
      newAdminId: this.parent.targetUserId,
      newState: "Activo",
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
  }

  async leaveAdminRole(_actorUserId: string): Promise<void> {
    throw new InvalidStateTransitionError("TransferAccepted", "leaveAdminRole", "Transferencia en proceso de confirmacion. Complete o rechace la transferencia primero.");
  }
}
