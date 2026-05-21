import type { IState, IGroupContext, GroupStateEvent } from "./IState";

export class TransferAccepted implements IState {
  readonly stateName = "TransferenciaAceptada";
  private context!: IGroupContext;

  constructor(private readonly parent: IState) {}

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new Error("Transferencia en proceso de confirmación.");
  }

  async aceptar(): Promise<void> {
    throw new Error("Transferencia ya aceptada, esperando confirmación.");
  }

  async rechazar(): Promise<void> {
    return this.parent.rechazar();
  }

  async transferir(): Promise<void> {
    const previousAdminId = this.context.adminId;
    this.context.adminId = this.context.targetUserId;
    this.context.transitionToActive();

    const event: GroupStateEvent = {
      type: "ADMIN_TRANSFER_COMPLETED",
      timestamp: new Date().toISOString(),
      transferId: this.context.transferId,
      requestId: this.context.requestId,
      oldAdminId: previousAdminId,
      newAdminId: this.context.targetUserId,
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
  }

  async leaveAdminRole(_actorUserId: string): Promise<void> {
    throw new Error("Transferencia en proceso de confirmación. Complete o rechace la transferencia primero.");
  }
}
