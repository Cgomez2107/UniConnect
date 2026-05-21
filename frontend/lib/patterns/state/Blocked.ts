import type { IState, IGroupContext } from "./IState";

export class Blocked implements IState {
  readonly stateName = "Bloqueado";
  private context!: IGroupContext;

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new Error("El grupo está bloqueado. No se pueden realizar transferencias de administrador.");
  }

  async aceptar(): Promise<void> {
    throw new Error("El grupo está bloqueado. Operación no permitida.");
  }

  async rechazar(): Promise<void> {
    throw new Error("El grupo está bloqueado. Operación no permitida.");
  }

  async transferir(): Promise<void> {
    throw new Error("El grupo está bloqueado. Operación no permitida.");
  }

  async leaveAdminRole(_actorUserId: string): Promise<void> {
    throw new Error("El grupo está bloqueado. Operación no permitida.");
  }
}
