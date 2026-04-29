import type { IAdminTransferRepository } from "../domain/repositories/IAdminTransferRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export interface AcceptAdminTransferInput {
  readonly transferId: string;
  readonly actorUserId: string;
}

export class AcceptAdminTransfer {
  constructor(private readonly repository: IAdminTransferRepository) {}

  async execute(input: AcceptAdminTransferInput): Promise<void> {
    const transferId = requireTrimmed(input.transferId, "transferId");

    await this.repository.acceptTransfer({
      transferId,
      actorUserId: input.actorUserId,
    });
  }
}
