import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IState, IGroupContext } from "./IState.js";
import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import { Active } from "./Active.js";
import { TransferAccepted } from "./TransferAccepted.js";

export class PendingTransfer implements IState {
  private context!: IGroupContext;

  constructor(
    private readonly previousState: IState,
    readonly targetUserId: string,
    readonly transferId: string,
  ) {}

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new InvalidStateTransitionError("PendingTransfer", "solicitar", "Ya existe una transferencia de administrador pendiente para este grupo.");
  }

  async aceptar(): Promise<void> {
    this.context.transitionTo(new TransferAccepted(this));

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_ACCEPTED",
      version: "1.0",
      timestamp: new Date(),
      transferId: this.transferId,
      groupId: this.context.requestId,
      oldAdminId: this.context.adminId,
      newAdminId: this.targetUserId,
      newState: "TransferenciaAceptada",
      acceptedBy: this.targetUserId,
    };

    await this.context.emit(event);
  }

  async rechazar(): Promise<void> {
    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_REJECTED",
      version: "1.0",
      timestamp: new Date(),
      transferId: this.transferId,
      groupId: this.context.requestId,
      oldAdminId: this.context.adminId,
      newAdminId: this.targetUserId,
      newState: "Activo",
      groupName: this.context.groupName,
    };

    await this.context.emit(event);

    this.context.transitionTo(new Active());
  }

  async transferir(): Promise<void> {
    throw new InvalidStateTransitionError("PendingTransfer", "transferir", "Debe aceptar o rechazar la transferencia primero.");
  }

  async leaveAdminRole(actorUserId: string): Promise<void> {
    if (this.context.adminId !== actorUserId) {
      throw new InvalidStateTransitionError("PendingTransfer", "leaveAdminRole", "Solo el administrador actual puede renunciar a su cargo.");
    }

    if (this.context.adminCount <= 1) {
      throw new InvalidStateTransitionError("PendingTransfer", "leaveAdminRole", "Eres el unico administrador. Debes transferir el mando antes de salir.");
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
