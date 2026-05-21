import type { IState, IGroupContext } from "./IState";

export class Dissolved implements IState {
  readonly stateName = "Disuelto";
  private context!: IGroupContext;

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new Error("El grupo está disuelto. No se pueden realizar transferencias de administrador.");
  }

  async aceptar(): Promise<void> {
    throw new Error("El grupo está disuelto. Operación no permitida.");
  }

  async rechazar(): Promise<void> {
    throw new Error("El grupo está disuelto. Operación no permitida.");
  }

  async transferir(): Promise<void> {
    throw new Error("El grupo está disuelto. Operación no permitida.");
  }

  async leaveAdminRole(_actorUserId: string): Promise<void> {
    throw new Error("El grupo está disuelto. Operación no permitida.");
  }
}
