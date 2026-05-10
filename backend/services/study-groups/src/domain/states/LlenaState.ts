import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";
import { TransferenciaPendienteState } from "./TransferenciaPendienteState.js";

export class LlenaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(_applicationId: string, _applicantId: string, _applicantName: string, _message: string, _adminUserId: string): void {
    throw new InvalidStateTransitionError("Llena", "applyToGroup", "El grupo ya está lleno. No se aceptan nuevas postulaciones.");
  }

  reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, _applicantName?: string): void {
    // Solo permite rechazar postulaciones pendientes.
    if (status === 'approved') {
      throw new InvalidStateTransitionError("Llena", "reviewApplication(approved)", "No se pueden aceptar más miembros. El grupo ya está lleno.");
    }

    this.context.emit({
      type: "MIEMBRO_RECHAZADO",
      version: "1.0",
      timestamp: new Date(),
      applicationId,
      requestId: this.context.requestId,
      applicantId,
      rejectedBy: reviewerId
    });
  }

  async requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string, currentState: string): Promise<void> {
    // Transición: Pasamos a transferencia pendiente guardando este estado.
    this.context.transitionTo(new TransferenciaPendienteState(this));

    await this.context.emit({
      type: "TRANSFERENCIA_ADMIN_SOLICITADA",
      version: "1.0",
      timestamp: new Date(),
      transferId,
      groupId: this.context.requestId,
      oldAdminId: actorUserId,
      newAdminId: targetUserId,
      currentState: currentState,
      groupName: this.context.groupName
    });
  }

  async acceptAdminTransfer(_transferId: string, _actorUserId: string, _fromUserId: string, _toUserId: string, _previousState: string): Promise<void> {
    throw new InvalidStateTransitionError("Llena", "acceptAdminTransfer", "No hay ninguna transferencia de administrador pendiente para aceptar.");
  }

  leaveAdminRole(_actorUserId: string): void {
    // Acción válida: El administrador abandona el grupo.
  }
}
