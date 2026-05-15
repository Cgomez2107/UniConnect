import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IState, IGroupContext } from "./IState.js";
import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import { PendingTransfer } from "./PendingTransfer.js";

export class Active implements IState {
  private context!: IGroupContext;

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    const targetUserId = this.context.targetUserId;
    if (!targetUserId) {
      throw new InvalidStateTransitionError("Active", "solicitar", "No se especificó un usuario destino.");
    }

    const transferId = crypto.randomUUID();
    this.context.transferId = transferId;
    this.context.transitionTo(new PendingTransfer(this, targetUserId, transferId));

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_REQUESTED",
      version: "1.0",
      timestamp: new Date(),
      transferId,
      groupId: this.context.requestId,
      oldAdminId: this.context.adminId,
      newAdminId: targetUserId,
      newState: "PendienteTransferencia",
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
  }

  async aceptar(): Promise<void> {
    throw new InvalidStateTransitionError("Active", "aceptar", "No hay ninguna transferencia de administrador pendiente para aceptar.");
  }

  async rechazar(): Promise<void> {
    throw new InvalidStateTransitionError("Active", "rechazar", "No hay ninguna transferencia de administrador pendiente para rechazar.");
  }

  async transferir(): Promise<void> {
    throw new InvalidStateTransitionError("Active", "transferir", "No hay ninguna transferencia de administrador pendiente para transferir.");
  }

  async leaveAdminRole(actorUserId: string): Promise<void> {
    if (this.context.adminId !== actorUserId) {
      throw new InvalidStateTransitionError("Active", "leaveAdminRole", "Solo el administrador actual puede renunciar a su cargo.");
    }

    if (this.context.adminCount <= 1) {
      throw new InvalidStateTransitionError("Active", "leaveAdminRole", "Eres el unico administrador. Debes transferir el mando antes de salir.");
    }

    const event: StudyGroupEvent = {
      type: "ADMIN_ROLE_LEFT",
      version: "1.0",
      timestamp: new Date(),
      requestId: this.context.requestId,
      userId: actorUserId,
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
  }
}
