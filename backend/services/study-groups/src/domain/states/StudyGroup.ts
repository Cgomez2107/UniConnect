import type { IStudyGroupState, IStudyGroupContext } from "./IStudyGroupState.js";
import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import type { ISubject } from "../events/observers/ISubject.js";

export class StudyGroup implements IStudyGroupContext {
  private state!: IStudyGroupState;
  private _membersCount: number;

  constructor(
    public readonly requestId: string,
    public readonly groupName: string,
    public readonly maxMembers: number,
    initialMembersCount: number,
    initialState: IStudyGroupState,
    private readonly subject: ISubject
  ) {
    this._membersCount = initialMembersCount;
    this.transitionTo(initialState);
  }

  get membersCount(): number {
    return this._membersCount;
  }

  public incrementMembersCount(): void {
    this._membersCount++;
  }

  public transitionTo(state: IStudyGroupState): void {
    this.state = state;
    this.state.setContext(this);
  }

  public emit(event: StudyGroupEvent): Promise<void> {
    // No tragamos el error; lo propagamos para que el caso de uso pueda manejarlo
    return this.subject.emit(event);
  }

  public applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void {
    this.state.applyToGroup(applicationId, applicantId, applicantName, message, adminUserId);
  }

  public reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void {
    this.state.reviewApplication(applicationId, status, reviewerId, applicantId, applicantName);
  }

  public requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string, currentState: string): Promise<void> {
    return this.state.requestAdminTransfer(transferId, actorUserId, targetUserId, currentState);
  }

  public acceptAdminTransfer(transferId: string, actorUserId: string, fromUserId: string, toUserId: string, previousState: string): Promise<void> {
    return this.state.acceptAdminTransfer(transferId, actorUserId, fromUserId, toUserId, previousState);
  }

  public leaveAdminRole(actorUserId: string): void {
    this.state.leaveAdminRole(actorUserId);
  }
}
