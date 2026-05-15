import type { AdminTransfer } from "../../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface RequestAdminTransferInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly targetUserId: string;
}

export class RequestAdminTransfer {
  constructor(
    private readonly repository: IAdminTransferRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: RequestAdminTransferInput): Promise<AdminTransfer> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");
    const targetUserId = requireTrimmed(input.targetUserId, "targetUserId");

    const group = await this.studyGroupRepository.loadStudyGroup(
      requestId,
      this.subject,
    );

    await group.requestAdminTransfer(targetUserId);

    const created = await this.repository.requestTransfer({
      requestId,
      actorUserId: input.actorUserId,
      targetUserId,
    });

    return created;
  }
}
