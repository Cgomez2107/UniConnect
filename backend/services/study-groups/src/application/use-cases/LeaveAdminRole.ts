import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface LeaveAdminRoleInput {
  readonly requestId: string;
  readonly actorUserId: string;
}

export class LeaveAdminRole {
  constructor(
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: LeaveAdminRoleInput): Promise<void> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    const group = await this.studyGroupRepository.loadStudyGroup(
      requestId,
      this.subject,
    );

    await group.leaveAdminRole(actorUserId);
  }
}
