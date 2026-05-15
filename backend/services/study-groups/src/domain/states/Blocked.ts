import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IState, IGroupContext } from "./IState.js";

export class Blocked implements IState {
  private context!: IGroupContext;

  setContext(context: IGroupContext): void {
    this.context = context;
  }

  async solicitar(): Promise<void> {
    throw new InvalidStateTransitionError("Blocked", "solicitar", "El grupo está bloqueado. No se pueden realizar transferencias de administrador.");
  }

  async aceptar(): Promise<void> {
    throw new InvalidStateTransitionError("Blocked", "aceptar", "El grupo está bloqueado. Operación no permitida.");
  }

  async rechazar(): Promise<void> {
    throw new InvalidStateTransitionError("Blocked", "rechazar", "El grupo está bloqueado. Operación no permitida.");
  }

  async transferir(): Promise<void> {
    throw new InvalidStateTransitionError("Blocked", "transferir", "El grupo está bloqueado. Operación no permitida.");
  }

  async leaveAdminRole(_actorUserId: string): Promise<void> {
    throw new InvalidStateTransitionError("Blocked", "leaveAdminRole", "El grupo está bloqueado. Operación no permitida.");
  }
}
