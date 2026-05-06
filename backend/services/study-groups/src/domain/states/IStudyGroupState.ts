export interface IStudyGroupContext {
  transitionTo(state: IStudyGroupState): void;
  // Añadimos cualquier otro método público que el estado necesite llamar del contexto
}

export interface IStudyGroupState {
  setContext(context: IStudyGroupContext): void;

  applyToGroup(memberId: string): void;
  reviewApplication(applicationId: string, status: string): void;
  requestAdminTransfer(targetUserId: string): void;
  acceptAdminTransfer(transferId: string): void;
  leaveAdminRole(): void;
}
