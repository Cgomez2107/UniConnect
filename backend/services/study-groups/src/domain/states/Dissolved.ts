import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IState, IGroupContext } from "./IState.js";

export class Dissolved implements IState {
  private context!: IGroupContext;

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new InvalidStateTransitionError("Dissolved", "solicitar", "El grupo está disuelto. No se pueden realizar transferencias de administrador.");
  }

  async aceptar(): Promise<void> {
    throw new InvalidStateTransitionError("Dissolved", "aceptar", "El grupo está disuelto. Operación no permitida.");
  }

  async rechazar(): Promise<void> {
    throw new InvalidStateTransitionError("Dissolved", "rechazar", "El grupo está disuelto. Operación no permitida.");
  }

  async transferir(): Promise<void> {
    throw new InvalidStateTransitionError("Dissolved", "transferir", "El grupo está disuelto. Operación no permitida.");
  }

  async leaveAdminRole(_actorUserId: string): Promise<void> {
    throw new InvalidStateTransitionError("Dissolved", "leaveAdminRole", "El grupo está disuelto. Operación no permitida.");
  }
}
