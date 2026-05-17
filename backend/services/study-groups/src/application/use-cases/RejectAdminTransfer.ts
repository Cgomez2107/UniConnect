import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import type { IAdminTransferRepository } from "../../domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface RejectAdminTransferInput {
  readonly transferId: string;
  readonly actorUserId: string;
}

export class RejectAdminTransfer {
  constructor(
    private readonly repository: IAdminTransferRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: RejectAdminTransferInput): Promise<void> {
    const transferId = requireTrimmed(input.transferId, "transferId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    const transfer = await this.repository.getById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transferencia '${transferId}' no encontrada.`);
    }

    if (transfer.toUserId !== actorUserId) {
      throw new AuthorizationError("No autorizado para rechazar esta transferencia.");
    }

    const group = await this.studyGroupRepository.loadStudyGroup(
      transfer.requestId,
      this.subject,
    );

    await group.rejectAdminTransfer();

    await this.repository.rejectTransfer({
      transferId,
      actorUserId,
    });
  }
}
