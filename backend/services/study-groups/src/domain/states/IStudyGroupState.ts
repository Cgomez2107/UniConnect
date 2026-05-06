import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";

export interface IStudyGroupContext {
  readonly requestId: string;
  readonly groupName: string;
  transitionTo(state: IStudyGroupState): void;
  emit(event: StudyGroupEvent): void;
}

export interface IStudyGroupState {
  setContext(context: IStudyGroupContext): void;

  applyToGroup(applicationId: string, applicantId: string, applicantName: string, message: string, adminUserId: string): void;
  reviewApplication(applicationId: string, status: 'approved' | 'rejected', reviewerId: string, applicantId: string, applicantName?: string): void;
  requestAdminTransfer(transferId: string, actorUserId: string, targetUserId: string): void;
  acceptAdminTransfer(transferId: string, actorUserId: string, fromUserId: string, toUserId: string): void;
  leaveAdminRole(actorUserId: string): void;
}
