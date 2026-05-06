import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";
import { TransferenciaPendienteState } from "./TransferenciaPendienteState.js";

export class AbiertaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(memberId: string): void {
    // Acción válida: Permite postularse. No requiere transición.
  }

  reviewApplication(applicationId: string, status: string): void {
    // Acción válida: Permite revisar postulaciones.
  }

  requestAdminTransfer(targetUserId: string): void {
    // Transición: Pasamos al estado de transferencia pendiente y guardamos el estado anterior.
    this.context.transitionTo(new TransferenciaPendienteState(this));
  }

  acceptAdminTransfer(transferId: string): void {
    throw new Error("No hay ninguna transferencia de administrador pendiente para aceptar.");
  }

  leaveAdminRole(): void {
    // Acción válida: El administrador abandona el grupo.
  }
}
