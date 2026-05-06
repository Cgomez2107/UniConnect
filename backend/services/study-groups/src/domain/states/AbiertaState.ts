import { DomainError } from "../../../../../shared/libs/errors/DomainError.js";
import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";
import { TransferenciaPendienteState } from "./TransferenciaPendienteState.js";
import { LlenaState } from "./LlenaState.js";

export class AbiertaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void {
    // Acción válida: Permite postularse.
    this.context.emit({
      type: "SOLICITUD_INGRESO",
      version: "1.0",
      timestamp: new Date(),
      requestId: this.context.requestId,
      applicantId,
      recipientUserId: adminUserId,
      message,
      groupName: this.context.groupName,
      applicantName
    });
  }

  reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void {
    // Acción válida: Permite revisar postulaciones.
    if (status === 'approved') {
      this.context.incrementMembersCount();

      this.context.emit({
        type: "MIEMBRO_ACEPTADO",
        version: "1.0",
        timestamp: new Date(),
        applicationId,
        requestId: this.context.requestId,
        applicantId,
        applicantName: applicantName ?? "Usuario",
        approvedBy: reviewerId,
        groupName: this.context.groupName
      });

      // Validar si alcanzamos el límite de cupos tras aceptar
      if (this.context.membersCount >= this.context.maxMembers) {
        this.context.transitionTo(new LlenaState());
      }
    } else {
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
  }

  requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string): void {
    // Transición: Pasamos al estado de transferencia pendiente y guardamos el estado anterior.
    this.context.transitionTo(new TransferenciaPendienteState(this));
    
    // Emitimos el evento
    this.context.emit({
      type: "TRANSFERENCIA_ADMIN_SOLICITADA",
      version: "1.0",
      timestamp: new Date(),
      transferId,
      requestId: this.context.requestId,
      actorUserId,
      targetUserId,
      groupName: this.context.groupName
    });
  }

  acceptAdminTransfer(_transferId: string, _actorUserId: string, _fromUserId: string, _toUserId: string): void {
    throw new DomainError("No hay ninguna transferencia de administrador pendiente para aceptar.");
  }

  leaveAdminRole(actorUserId: string): void {
    // Acción válida: El administrador abandona el grupo.
  }
}
