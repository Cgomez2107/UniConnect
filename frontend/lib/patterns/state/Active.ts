import type { IState, IGroupContext, GroupStateEvent } from "./IState";

export class Active implements IState {
  readonly stateName = "Activo";
  private context!: IGroupContext;

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    const targetUserId = this.context.targetUserId;
    if (!targetUserId) {
      throw new Error("No se especificó un usuario destino para la transferencia.");
    }

    const transferId = crypto.randomUUID();
    this.context.transferId = transferId;
    this.context.transitionToPendingTransfer(this, targetUserId, transferId);

    const event: GroupStateEvent = {
      type: "ADMIN_TRANSFER_REQUESTED",
      timestamp: new Date().toISOString(),
      transferId,
      requestId: this.context.requestId,
      oldAdminId: this.context.adminId,
      newAdminId: targetUserId,
      groupName: this.context.groupName,
    };

    await this.context.emit(event);
  }

  async aceptar(): Promise<void> {
    throw new Error("No hay ninguna transferencia de administrador pendiente para aceptar.");
  }

  async rechazar(): Promise<void> {
    throw new Error("No hay ninguna transferencia de administrador pendiente para rechazar.");
  }

  async transferir(): Promise<void> {
    throw new Error("No hay ninguna transferencia de administrador pendiente para transferir.");
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
