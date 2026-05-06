import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";
import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import type { ISubject } from "../events/observers/ISubject.js";

export class StudyGroup implements IStudyGroupContext {
  private state!: IStudyGroupState;

  constructor(
    public readonly requestId: string,
    public readonly groupName: string,
    initialState: IStudyGroupState,
    private readonly subject: ISubject
  ) {
    this.transitionTo(initialState);
  }

  public transitionTo(state: IStudyGroupState): void {
    this.state = state;
    this.state.setContext(this);
  }

  public emit(event: StudyGroupEvent): void {
    this.subject.emit(event).catch((error) => {
      console.error(`[StudyGroup Context] Error emitiendo evento ${event.type}:`, error);
    });
  }

  public applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void {
    this.state.applyToGroup(applicationId, applicantId, applicantName, message, adminUserId);
  }

  public reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void {
    this.state.reviewApplication(applicationId, status, reviewerId, applicantId, applicantName);
  }

  public requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string): void {
    this.state.requestAdminTransfer(transferId, actorUserId, targetUserId);
  }

  public acceptAdminTransfer(transferId: string, actorUserId: string, fromUserId: string, toUserId: string): void {
    this.state.acceptAdminTransfer(transferId, actorUserId, fromUserId, toUserId);
  }

  public leaveAdminRole(actorUserId: string): void {
    this.state.leaveAdminRole(actorUserId);
  }
}
