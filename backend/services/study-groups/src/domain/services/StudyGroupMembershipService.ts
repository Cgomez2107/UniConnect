import type { ISubject } from "../events/observers/ISubject.js";
import type { StudyGroupEvent } from "../events/StudyGroupEvents.js";
import type { GroupContext } from "../states/GroupContext.js";

export class StudyGroupMembershipService {
  constructor(private readonly subject: ISubject) {}

  async applyToGroup(
    contexto: GroupContext,
    applicantId: string,
    applicantName: string,
    message: string,
    recipientUserId: string,
  ): Promise<void> {
    const event: StudyGroupEvent = {
      type: "JOIN_REQUEST",
      version: "1.0",
      timestamp: new Date(),
      requestId: contexto.requestId,
      applicantId,
      recipientUserId,
      message,
      groupName: contexto.groupName,
      applicantName,
    };
    await this.subject.emit(event);
  }

  async reviewApplication(
    contexto: GroupContext,
    applicationId: string,
    status: "approved" | "rejected",
    reviewerId: string,
    applicantId: string,
    applicantName?: string,
  ): Promise<void> {
    if (status === "approved") {
      const event: StudyGroupEvent = {
        type: "MEMBER_ACCEPTED",
        version: "1.0",
        timestamp: new Date(),
        applicationId,
        requestId: contexto.requestId,
        applicantId,
        applicantName: applicantName ?? "Nuevo integrante",
        approvedBy: reviewerId,
        groupName: contexto.groupName,
      };
      await this.subject.emit(event);
    } else {
      const event: StudyGroupEvent = {
        type: "MEMBER_REJECTED",
        version: "1.0",
        timestamp: new Date(),
        applicationId,
        requestId: contexto.requestId,
        applicantId,
        rejectedBy: reviewerId,
      };
      await this.subject.emit(event);
    }
  }
}
