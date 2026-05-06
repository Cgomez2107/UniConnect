import { DomainError } from "../../../../../shared/libs/errors/DomainError.js";
import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class CerradaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(_applicationId: string, _applicantId: string, _applicantName: string, _message: string, _adminUserId: string): void {
    throw new DomainError("El grupo está cerrado. No se aceptan más solicitudes.");
  }

  reviewApplication(_applicationId: string, _status: 'approved' | 'rejected', _reviewerId: string, _applicantId: string, _applicantName?: string): void {
    throw new DomainError("El grupo está cerrado. No se pueden revisar solicitudes.");
  }

  requestAdminTransfer(_transferId: string, _actorUserId: string, _targetUserId: string): void {
    throw new DomainError("El grupo está cerrado. No se pueden realizar transferencias de administrador.");
  }

  acceptAdminTransfer(_transferId: string, _actorUserId: string, _fromUserId: string, _toUserId: string): void {
    throw new DomainError("El grupo está cerrado. No se pueden aceptar transferencias.");
  }

  leaveAdminRole(_actorUserId: string): void {
    throw new DomainError("El grupo está cerrado. Operación no permitida.");
  }
}
