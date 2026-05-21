import type { IState, IGroupContext, GroupStateEvent } from "./IState";

export class PendingTransfer implements IState {
  readonly stateName = "PendienteTransferencia";
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
    throw new Error("Ya existe una transferencia de administrador pendiente para este grupo.");
  }

  async aceptar(): Promise<void> {
    this.context.transitionToTransferAccepted(this);

    const event: GroupStateEvent = {
      type: "ADMIN_TRANSFER_ACCEPTED",
      timestamp: new Date().toISOString(),
      transferId: this.transferId,
      requestId: this.context.requestId,
      oldAdminId: this.context.adminId,
      newAdminId: this.targetUserId,
    };

    await this.context.emit(event);
  }

  async rechazar(): Promise<void> {
    const event: GroupStateEvent = {
      type: "ADMIN_TRANSFER_REJECTED",
      timestamp: new Date().toISOString(),
      transferId: this.transferId,
      requestId: this.context.requestId,
      oldAdminId: this.context.adminId,
      newAdminId: this.targetUserId,
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
    this.context.transitionToActive();
  }

  async transferir(): Promise<void> {
    throw new Error("Debe aceptar o rechazar la transferencia primero.");
  }

  async leaveAdminRole(actorUserId: string): Promise<void> {
    if (this.context.adminId !== actorUserId) {
      throw new Error("Solo el administrador actual puede renunciar a su cargo.");
    }

    if (this.context.adminCount <= 1) {
      throw new Error("Eres el único administrador. Debes transferir el mando antes de salir.");
    }

    const event: GroupStateEvent = {
      type: "ADMIN_ROLE_LEFT",
      timestamp: new Date().toISOString(),
      requestId: this.context.requestId,
      actorUserId,
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
  }
}
