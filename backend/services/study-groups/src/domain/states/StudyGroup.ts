import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";

export class StudyGroup implements IStudyGroupContext {
  private state!: IStudyGroupState;

  constructor(initialState: IStudyGroupState) {
    this.transitionTo(initialState);
  }

  public transitionTo(state: IStudyGroupState): void {
    this.state = state;
    this.state.setContext(this);
  }

  public applyToGroup(memberId: string): void {
    this.state.applyToGroup(memberId);
  }

  public reviewApplication(applicationId: string, status: string): void {
    this.state.reviewApplication(applicationId, status);
  }

  public requestAdminTransfer(targetUserId: string): void {
    this.state.requestAdminTransfer(targetUserId);
  }

  public acceptAdminTransfer(transferId: string): void {
    this.state.acceptAdminTransfer(transferId);
  }

  public leaveAdminRole(): void {
    this.state.leaveAdminRole();
  }
}
