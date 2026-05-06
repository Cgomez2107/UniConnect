import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";
import { TransferenciaPendienteState } from "./TransferenciaPendienteState.js";

export class LlenaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(memberId: string): void {
    throw new Error("El grupo ya ha alcanzado su capacidad máxima.");
  }

  reviewApplication(applicationId: string, status: string): void {
    // Acción válida: Permite revisar postulaciones pendientes.
  }

  requestAdminTransfer(targetUserId: string): void {
    // Transición: Pasamos a transferencia pendiente guardando este estado.
    this.context.transitionTo(new TransferenciaPendienteState(this));
  }

  acceptAdminTransfer(transferId: string): void {
    throw new Error("No hay ninguna transferencia de administrador pendiente para aceptar.");
  }

  leaveAdminRole(): void {
    // Acción válida: El administrador abandona el grupo.
  }
}
