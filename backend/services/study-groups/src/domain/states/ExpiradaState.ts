import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class ExpiradaState implements IStudyGroupState {
  private context!: IStudyGroupContext;

  setContext(context: IStudyGroupContext): void {
    this.context = context;
  }

  applyToGroup(_applicationId: string, _applicantId: string, _applicantName: string, _message: string, _adminUserId: string): void {
    throw new InvalidStateTransitionError("Expirada", "applyToGroup", "El grupo ha expirado. No se pueden enviar nuevas postulaciones.");
  }

  reviewApplication(_applicationId: string, _status: 'approved' | 'rejected', _reviewerId: string, _applicantId: string, _applicantName?: string): void {
    throw new InvalidStateTransitionError("Expirada", "reviewApplication", "El grupo ha expirado. No se pueden revisar solicitudes.");
  }

  async requestAdminTransfer(_transferId: string, _actorUserId: string, _targetUserId: string, _currentState: string): Promise<void> {
    throw new InvalidStateTransitionError("Expirada", "requestAdminTransfer", "El grupo ha expirado. No se pueden realizar transferencias de administrador.");
  }

  async acceptAdminTransfer(_transferId: string, _actorUserId: string, _fromUserId: string, _toUserId: string, _previousState: string): Promise<void> {
    throw new InvalidStateTransitionError("Expirada", "acceptAdminTransfer", "El grupo ha expirado. No se pueden aceptar transferencias.");
  }

  leaveAdminRole(_actorUserId: string): void {
    throw new InvalidStateTransitionError("Expirada", "leaveAdminRole", "El grupo ha expirado. Operación no permitida.");
  }
}
