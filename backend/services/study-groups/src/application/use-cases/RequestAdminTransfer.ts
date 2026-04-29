import type { AdminTransfer } from "../domain/entities/AdminTransfer.js";
import type { IAdminTransferRepository } from "../domain/repositories/IAdminTransferRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface RequestAdminTransferInput {
  readonly requestId: string;
  readonly actorUserId: string;
  readonly targetUserId: string;
}

export class RequestAdminTransfer {
  constructor(private readonly repository: IAdminTransferRepository) {}

  async execute(input: RequestAdminTransferInput): Promise<AdminTransfer> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const targetUserId = requireTrimmed(input.targetUserId, "targetUserId");

    return this.repository.requestTransfer({
      requestId,
      actorUserId: input.actorUserId,
      targetUserId,
    });
  }
}
